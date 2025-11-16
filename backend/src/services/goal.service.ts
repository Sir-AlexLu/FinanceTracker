// src/services/goal.service.ts
import { Goal, IGoal, GoalType } from '../models/Goal.js';
import { Account } from '../models/Account.js';
import { Liability } from '../models/Liability.js';
import { Transaction } from '../models/Transaction.js';
import { Notification } from '../models/Notification.js';
import { logger } from '../utils/logger.js';
import type { ExpenseCategory } from '../types/models.types.js';

export class GoalService {
  async create(userId: string, data: CreateGoalInput, ip: string, ua: string): Promise<IGoal> {
    // Validate linked resources
    if ([GoalType.SAVINGS, GoalType.INVESTMENT].includes(data.type)) {
      const acc = await Account.findOne({ _id: data.linkedAccountId, userId, isActive: true });
      if (!acc) throw new Error('Linked account not found');
    }

    if (data.type === GoalType.DEBT_PAYOFF) {
      const liab = await Liability.findOne({ _id: data.linkedLiabilityId, userId, status: { $ne: 'fully_paid' } });
      if (!liab) throw new Error('Linked liability not found');
    }

    const current = await this.calcCurrent(userId, data);
    const milestones = [25, 50, 75, 100].map(p => ({
      percentage: p,
      amount: data.targetAmount * p / 100,
      targetDate: this.milestoneDate(new Date(), new Date(data.targetDate), p),
      isAchieved: current >= data.targetAmount * p / 100,
    }));

    const goal = await Goal.create({
      userId,
      ...data,
      currentAmount: current,
      milestones,
      progress: { projectedCompletionDate: new Date(data.targetDate) },
    });

    logger.info({ userId, goalId: goal._id, type: goal.type, ip, ua }, 'Goal created');
    return goal;
  }

  private milestoneDate(start: Date, end: Date, pct: number): Date {
    const total = end.getTime() - start.getTime();
    return new Date(start.getTime() + total * pct / 100);
  }

  private async calcCurrent(userId: string, data: any): Promise<number> {
    switch (data.type) {
      case GoalType.SAVINGS:
      case GoalType.INVESTMENT:
        const acc = await Account.findById(data.linkedAccountId);
        return acc?.balance || 0;
      case GoalType.DEBT_PAYOFF:
        const liab = await Liability.findById(data.linkedLiabilityId);
        return liab?.paidAmount || 0;
      default:
        return 0;
    }
  }

  async updateProgress(goalId: string): Promise<IGoal> {
    const goal = await Goal.findById(goalId);
    if (!goal) throw new Error('Goal not found');

    const current = await this.calcCurrentForGoal(goal);
    goal.currentAmount = current;
    await goal.save();

    // Notify on new milestones
    const newMilestones = goal.milestones.filter(m => m.isAchieved && !m.achievedDate);
    for (const m of newMilestones) {
      await Notification.create({
        userId: goal.userId,
        type: 'GOAL_MILESTONE',
        title: `Milestone ${m.percentage}% Achieved!`,
        message: `You've hit ${m.percentage}% of "${goal.name}"`,
        priority: 'MEDIUM',
        actionUrl: `/goals/${goal._id}`,
        relatedResourceId: goal._id,
      });
    }

    if (goal.status === 'completed' && !goal.completedAt) {
      await Notification.create({
        userId: goal.userId,
        type: 'GOAL_COMPLETED',
        title: `Goal Completed: ${goal.name}`,
        message: `You've achieved your goal!`,
        priority: 'HIGH',
        actionUrl: `/goals/${goal._id}`,
        relatedResourceId: goal._id,
      });
    }

    return goal;
  }

  private async calcCurrentForGoal(goal: IGoal): Promise<number> {
    switch (goal.type) {
      case GoalType.SAVINGS:
      case GoalType.INVESTMENT:
        const acc = await Account.findById(goal.linkedAccountId);
        return acc?.balance || goal.currentAmount;
      case GoalType.DEBT_PAYOFF:
        const liab = await Liability.findById(goal.linkedLiabilityId);
        return liab?.paidAmount || goal.currentAmount;
      case GoalType.EXPENSE_REDUCTION:
        const now = new Date();
        const [curr, prev] = await Promise.all([
          this.monthSpending(goal.userId, goal.linkedCategory!, now.getMonth(), now.getFullYear()),
          this.monthSpending(goal.userId, goal.linkedCategory!, now.getMonth() - 1, now.getFullYear())
        ]);
        return Math.max(0, prev - curr);
      default:
        return goal.currentAmount;
    }
  }

  private async monthSpending(userId: string, cat: ExpenseCategory, month: number, year: number): Promise<number> {
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    const txs = await Transaction.find({
      userId,
      type: 'EXPENSE',
      expenseCategory: cat,
      date: { $gte: start, $lte: end },
    });
    return txs.reduce((s, t) => s + t.amount, 0);
  }

  async getAll(userId: string, filters: any) {
    const query: any = { userId };
    if (filters.status) query.status = filters.status;
    if (filters.type) query.type = filters.type;

    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100);
    const skip = (page - 1) * limit;

    const [goals, total] = await Promise.all([
      Goal.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit)
        .populate('linkedAccountId', 'name type')
        .populate('linkedLiabilityId', 'description creditor'),
      Goal.countDocuments(query),
    ]);

    return { goals, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getById(userId: string, id: string): Promise<IGoal> {
    const goal = await Goal.findOne({ _id: id, userId })
      .populate('linkedAccountId', 'name type balance')
      .populate('linkedLiabilityId', 'description creditor totalAmount paidAmount');
    if (!goal) throw new Error('Goal not found');
    return goal;
  }

  async update(userId: string, id: string, data: UpdateGoalInput, ip: string, ua: string): Promise<IGoal> {
    const goal = await Goal.findOne({ _id: id, userId });
    if (!goal) throw new Error('Goal not found');

    Object.assign(goal, data);
    await goal.save();

    logger.info({ userId, goalId: id, changes: data, ip, ua }, 'Goal updated');
    return goal;
  }

  async delete(userId: string, id: string, ip: string, ua: string): Promise<void> {
    const goal = await Goal.findOne({ _id: id, userId });
    if (!goal) throw new Error('Goal not found');
    await Goal.findByIdAndDelete(id);
    logger.info({ userId, goalId: id, ip, ua }, 'Goal deleted');
  }

  async getSummary(userId: string) {
    const goals = await Goal.find({ userId });
    const active = goals.filter(g => g.status === 'active');
    const totalTarget = active.reduce((s, g) => s + g.targetAmount, 0);
    const totalCurrent = active.reduce((s, g) => s + g.currentAmount, 0);

    return {
      activeGoals: active.length,
      completedGoals: goals.filter(g => g.status === 'completed').length,
      totalTargetAmount: totalTarget,
      totalCurrentAmount: totalCurrent,
      overallProgress: totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0,
    };
  }

  // Called from TransactionService
  async updateLinkedGoals(userId: string, accountId: string): Promise<void> {
    const goals = await Goal.find({
      userId,
      linkedAccountId: accountId,
      status: 'active',
    });

    for (const goal of goals) {
      await this.updateProgress(goal._id.toString()).catch(() => {});
    }
  }
}
