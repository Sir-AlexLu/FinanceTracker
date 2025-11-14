import { Goal, IGoal, GoalType } from '../models/Goal';
import { Account } from '../models/Account';
import { Liability } from '../models/Liability';
import { Transaction } from '../models/Transaction';
import { Notification, NotificationType, NotificationPriority } from '../models/Notification';
import { AuditLog, AuditAction } from '../models/AuditLog';
import { ExpenseCategory, TransactionType } from '../types/models.types';
import { addMonths } from '../utils/dateHelpers';
import mongoose from 'mongoose';

export class GoalService {
  /**
   * Create a new goal
   */
  async createGoal(
    userId: string,
    data: {
      name: string;
      type: GoalType;
      description?: string;
      targetAmount: number;
      targetDate: string;
      linkedAccountId?: string;
      linkedLiabilityId?: string;
      linkedCategory?: ExpenseCategory;
      reminderFrequency?: 'weekly' | 'monthly' | 'none';
      notes?: string;
    },
    ipAddress: string,
    userAgent: string
  ): Promise<IGoal> {
    try {
      // Validate linked resources based on goal type
      if (data.type === GoalType.SAVINGS || data.type === GoalType.INVESTMENT) {
        if (!data.linkedAccountId) {
          throw new Error(`${data.type} goals must have a linked account`);
        }

        const account = await Account.findOne({
          _id: data.linkedAccountId,
          userId,
          isActive: true,
        });

        if (!account) {
          throw new Error('Linked account not found or inactive');
        }
      }

      if (data.type === GoalType.DEBT_PAYOFF) {
        if (!data.linkedLiabilityId) {
          throw new Error('Debt payoff goals must have a linked liability');
        }

        const liability = await Liability.findOne({
          _id: data.linkedLiabilityId,
          userId,
          status: { $ne: 'fully_paid' },
        });

        if (!liability) {
          throw new Error('Linked liability not found or already paid');
        }
      }

      if (data.type === GoalType.EXPENSE_REDUCTION) {
        if (!data.linkedCategory) {
          throw new Error('Expense reduction goals must have a linked category');
        }
      }

      // Calculate initial progress
      const currentAmount = await this.calculateCurrentAmount(userId, data);

      // Create milestones (25%, 50%, 75%, 100%)
      const milestones = [25, 50, 75, 100].map((percentage) => ({
        percentage,
        amount: (data.targetAmount * percentage) / 100,
        targetDate: this.calculateMilestoneDate(
          new Date(),
          new Date(data.targetDate),
          percentage
        ),
        isAchieved: false,
      }));

      const goalData = {
        userId,
        name: data.name,
        type: data.type,
        description: data.description,
        targetAmount: data.targetAmount,
        currentAmount,
        startDate: new Date(),
        targetDate: new Date(data.targetDate),
        linkedAccountId: data.linkedAccountId,
        linkedLiabilityId: data.linkedLiabilityId,
        linkedCategory: data.linkedCategory,
        progress: {
          percentage: 0,
          monthlyTarget: 0,
          monthlyContribution: 0,
          isOnTrack: true,
          projectedCompletionDate: new Date(data.targetDate),
        },
        milestones,
        status: 'active',
        reminderFrequency: data.reminderFrequency || 'monthly',
        notes: data.notes,
      };

      const goal = await Goal.create(goalData);

      // Progress will be calculated in pre-save hook

      // Audit log
      await AuditLog.log({
        userId: new mongoose.Types.ObjectId(userId),
        action: AuditAction.GOAL_CREATE,
        resource: 'Goal',
        resourceId: goal._id,
        details: {
          name: goal.name,
          type: goal.type,
          targetAmount: goal.targetAmount,
        },
        ipAddress,
        userAgent,
        statusCode: 201,
      });

      return goal;
    } catch (error: any) {
      throw new Error(`Failed to create goal: ${error.message}`);
    }
  }

  /**
   * Calculate current amount based on goal type
   */
  private async calculateCurrentAmount(
    userId: string,
    data: {
      type: GoalType;
      linkedAccountId?: string;
      linkedLiabilityId?: string;
      linkedCategory?: ExpenseCategory;
      targetAmount: number;
    }
  ): Promise<number> {
    try {
      switch (data.type) {
        case GoalType.SAVINGS:
        case GoalType.INVESTMENT: {
          if (!data.linkedAccountId) return 0;
          const account = await Account.findById(data.linkedAccountId);
          return account?.balance || 0;
        }

        case GoalType.DEBT_PAYOFF: {
          if (!data.linkedLiabilityId) return 0;
          const liability = await Liability.findById(data.linkedLiabilityId);
          return liability?.paidAmount || 0;
        }

        case GoalType.EXPENSE_REDUCTION: {
          // For expense reduction, target is reduction amount, current is amount saved
          // This needs baseline calculation - for now return 0
          return 0;
        }

        default:
          return 0;
      }
    } catch (error: any) {
      return 0;
    }
  }

  /**
   * Calculate milestone target date
   */
  private calculateMilestoneDate(startDate: Date, endDate: Date, percentage: number): Date {
    const totalDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    const daysToMilestone = (totalDays * percentage) / 100;
    const milestoneDate = new Date(startDate);
    milestoneDate.setDate(milestoneDate.getDate() + daysToMilestone);
    return milestoneDate;
  }

  /**
   * Update goal progress
   */
  async updateGoalProgress(goalId: string): Promise<IGoal> {
    try {
      const goal = await Goal.findById(goalId);

      if (!goal) {
        throw new Error('Goal not found');
      }

      // Calculate current amount based on goal type
      const currentAmount = await this.calculateCurrentAmountForGoal(goal);

      goal.currentAmount = currentAmount;

      // Progress metrics will be auto-calculated in pre-save hook
      await goal.save();

      // Check if milestones achieved
      const achievedMilestones = goal.milestones.filter(
        (m) => m.isAchieved && !m.achievedDate
      );

      // Send notifications for newly achieved milestones
      for (const milestone of achievedMilestones) {
        await Notification.create({
          userId: goal.userId,
          type: NotificationType.GOAL_MILESTONE,
          title: `Goal Milestone Achieved! 🎉`,
          message: `Congratulations! You've reached ${milestone.percentage}% of your goal "${goal.name}"`,
          priority: NotificationPriority.MEDIUM,
          isRead: false,
          actionUrl: `/goals/${goal._id}`,
          relatedResourceId: goal._id,
          relatedResourceType: 'Goal',
        });
      }

      // Check if goal completed
      if (goal.status === 'completed' && !goal.completedAt) {
        await Notification.create({
          userId: goal.userId,
          type: NotificationType.GOAL_MILESTONE,
          title: `Goal Completed! 🎊`,
          message: `Amazing! You've completed your goal "${goal.name}"!`,
          priority: NotificationPriority.HIGH,
          isRead: false,
          actionUrl: `/goals/${goal._id}`,
          relatedResourceId: goal._id,
          relatedResourceType: 'Goal',
        });
      }

      return goal;
    } catch (error: any) {
      throw new Error(`Failed to update goal progress: ${error.message}`);
    }
  }

  /**
   * Calculate current amount for existing goal
   */
  private async calculateCurrentAmountForGoal(goal: IGoal): Promise<number> {
    try {
      switch (goal.type) {
        case GoalType.SAVINGS:
        case GoalType.INVESTMENT: {
          if (!goal.linkedAccountId) return goal.currentAmount;
          const account = await Account.findById(goal.linkedAccountId);
          return account?.balance || goal.currentAmount;
        }

        case GoalType.DEBT_PAYOFF: {
          if (!goal.linkedLiabilityId) return goal.currentAmount;
          const liability = await Liability.findById(goal.linkedLiabilityId);
          return liability?.paidAmount || goal.currentAmount;
        }

        case GoalType.EXPENSE_REDUCTION: {
          if (!goal.linkedCategory) return goal.currentAmount;

          // Calculate spending reduction
          const now = new Date();
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

          const currentMonthSpending = await Transaction.find({
            userId: goal.userId,
            type: TransactionType.EXPENSE,
            expenseCategory: goal.linkedCategory,
            date: { $gte: monthStart, $lte: monthEnd },
          }).then((transactions) =>
            transactions.reduce((sum, t) => sum + t.amount, 0)
          );

          // Get baseline (previous month or initial)
          const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

          const baselineSpending = await Transaction.find({
            userId: goal.userId,
            type: TransactionType.EXPENSE,
            expenseCategory: goal.linkedCategory,
            date: { $gte: prevMonthStart, $lte: prevMonthEnd },
          }).then((transactions) =>
            transactions.reduce((sum, t) => sum + t.amount, 0)
          );

          const reduction = Math.max(0, baselineSpending - currentMonthSpending);
          return reduction;
        }

        default:
          return goal.currentAmount;
      }
    } catch (error: any) {
      return goal.currentAmount;
    }
  }

  /**
   * Get goals with filters
   */
  async getGoals(
    userId: string,
    filters: {
      status?: 'active' | 'completed' | 'abandoned' | 'paused';
      type?: GoalType;
      page?: number;
      limit?: number;
    }
  ): Promise<{ goals: IGoal[]; total: number; page: number; totalPages: number }> {
    try {
      const query: any = { userId };

      if (filters.status) query.status = filters.status;
      if (filters.type) query.type = filters.type;

      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const skip = (page - 1) * limit;

      const [goals, total] = await Promise.all([
        Goal.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('linkedAccountId', 'name type')
          .populate('linkedLiabilityId', 'description creditor'),
        Goal.countDocuments(query),
      ]);

      return {
        goals,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error: any) {
      throw new Error(`Failed to fetch goals: ${error.message}`);
    }
  }

  /**
   * Get goal by ID
   */
  async getGoalById(userId: string, goalId: string): Promise<IGoal> {
    try {
      const goal = await Goal.findOne({ _id: goalId, userId })
        .populate('linkedAccountId', 'name type balance')
        .populate('linkedLiabilityId', 'description creditor totalAmount paidAmount');

      if (!goal) {
        throw new Error('Goal not found');
      }

      return goal;
    } catch (error: any) {
      throw new Error(`Failed to fetch goal: ${error.message}`);
    }
  }

  /**
   * Update goal
   */
  async updateGoal(
    userId: string,
    goalId: string,
    data: {
      name?: string;
      description?: string;
      targetAmount?: number;
      targetDate?: string;
      status?: 'active' | 'completed' | 'abandoned' | 'paused';
      reminderFrequency?: 'weekly' | 'monthly' | 'none';
      notes?: string;
    },
    ipAddress: string,
    userAgent: string
  ): Promise<IGoal> {
    try {
      const goal = await Goal.findOne({ _id: goalId, userId });

      if (!goal) {
        throw new Error('Goal not found');
      }

      // Update fields
      if (data.name) goal.name = data.name;
      if (data.description !== undefined) goal.description = data.description;
      if (data.targetAmount) goal.targetAmount = data.targetAmount;
      if (data.targetDate) goal.targetDate = new Date(data.targetDate);
      if (data.status) goal.status = data.status;
      if (data.reminderFrequency) goal.reminderFrequency = data.reminderFrequency;
      if (data.notes !== undefined) goal.notes = data.notes;

      await goal.save();

      // Audit log
      await AuditLog.log({
        userId: new mongoose.Types.ObjectId(userId),
        action: data.status === 'completed' ? AuditAction.GOAL_COMPLETE : AuditAction.GOAL_UPDATE,
        resource: 'Goal',
        resourceId: goal._id,
        details: { changes: data },
        ipAddress,
        userAgent,
        statusCode: 200,
      });

      return goal;
    } catch (error: any) {
      throw new Error(`Failed to update goal: ${error.message}`);
    }
  }

  /**
   * Delete goal
   */
  async deleteGoal(
    userId: string,
    goalId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    try {
      const goal = await Goal.findOne({ _id: goalId, userId });

      if (!goal) {
        throw new Error('Goal not found');
      }

      await Goal.findByIdAndDelete(goalId);

      // Audit log
      await AuditLog.log({
        userId: new mongoose.Types.ObjectId(userId),
        action: AuditAction.GOAL_DELETE,
        resource: 'Goal',
        resourceId: goal._id,
        details: {
          name: goal.name,
          type: goal.type,
        },
        ipAddress,
        userAgent,
        statusCode: 200,
      });
    } catch (error: any) {
      throw new Error(`Failed to delete goal: ${error.message}`);
    }
  }

  /**
   * Get goal summary
   */
  async getGoalSummary(userId: string): Promise<{
    activeGoals: number;
    completedGoals: number;
    totalTargetAmount: number;
    totalCurrentAmount: number;
    overallProgress: number;
  }> {
    try {
      const goals = await Goal.find({ userId });

      let activeGoals = 0;
      let completedGoals = 0;
      let totalTargetAmount = 0;
      let totalCurrentAmount = 0;

      goals.forEach((goal) => {
        if (goal.status === 'active') {
          activeGoals++;
          totalTargetAmount += goal.targetAmount;
          totalCurrentAmount += goal.currentAmount;
        }
        if (goal.status === 'completed') {
          completedGoals++;
        }
      });

      const overallProgress =
        totalTargetAmount > 0 ? (totalCurrentAmount / totalTargetAmount) * 100 : 0;

      return {
        activeGoals,
        completedGoals,
        totalTargetAmount,
        totalCurrentAmount,
        overallProgress,
      };
    } catch (error: any) {
      throw new Error(`Failed to get goal summary: ${error.message}`);
    }
  }
}
