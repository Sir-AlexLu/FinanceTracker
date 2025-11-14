import { Budget, IBudget } from '../models/Budget';
import { Transaction } from '../models/Transaction';
import { Notification, NotificationType, NotificationPriority } from '../models/Notification';
import { AuditLog, AuditAction } from '../models/AuditLog';
import { ExpenseCategory, TransactionType } from '../types/models.types';
import { getMonthStart, getMonthEnd, addDays } from '../utils/dateHelpers';
import mongoose from 'mongoose';

export class BudgetService {
  /**
   * Create a new budget
   */
  async createBudget(
    userId: string,
    data: {
      name: string;
      category: ExpenseCategory;
      amount: number;
      period: 'weekly' | 'monthly' | 'yearly';
      startDate: string;
      alertThreshold?: number;
      notes?: string;
    },
    ipAddress: string,
    userAgent: string
  ): Promise<IBudget> {
    try {
      const startDate = new Date(data.startDate);
      let endDate = new Date(startDate);

      // Calculate end date based on period
      switch (data.period) {
        case 'weekly':
          endDate.setDate(endDate.getDate() + 7);
          break;
        case 'monthly':
          endDate.setMonth(endDate.getMonth() + 1);
          break;
        case 'yearly':
          endDate.setFullYear(endDate.getFullYear() + 1);
          break;
      }

      // Calculate current spending
      const spent = await this.calculateSpending(userId, data.category, startDate, endDate);

      const budgetData = {
        userId,
        name: data.name,
        category: data.category,
        amount: data.amount,
        spent,
        period: data.period,
        startDate,
        endDate,
        isActive: true,
        alertThreshold: data.alertThreshold || 80,
        notes: data.notes,
      };

      const budget = await Budget.create(budgetData);

      // Check if alert should be sent
      await this.checkBudgetAlert(budget);

      // Audit log
      await AuditLog.log({
        userId: new mongoose.Types.ObjectId(userId),
        action: AuditAction.BUDGET_CREATE,
        resource: 'Budget',
        resourceId: budget._id,
        details: {
          name: budget.name,
          category: budget.category,
          amount: budget.amount,
        },
        ipAddress,
        userAgent,
        statusCode: 201,
      });

      return budget;
    } catch (error: any) {
      throw new Error(`Failed to create budget: ${error.message}`);
    }
  }

  /**
   * Calculate spending for a category in a date range
   */
  private async calculateSpending(
    userId: string,
    category: ExpenseCategory,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    try {
      const transactions = await Transaction.find({
        userId,
        type: TransactionType.EXPENSE,
        expenseCategory: category,
        date: { $gte: startDate, $lte: endDate },
        isLiabilityPayment: false, // Don't count liability payments
      });

      const total = transactions.reduce((sum, t) => sum + t.amount, 0);
      return total;
    } catch (error: any) {
      throw new Error(`Failed to calculate spending: ${error.message}`);
    }
  }

  /**
   * Update budget spending (called when transaction is created)
   */
  async updateBudgetSpending(
    userId: string,
    category: ExpenseCategory,
    amount: number,
    date: Date
  ): Promise<void> {
    try {
      // Find active budgets for this category that include this date
      const budgets = await Budget.find({
        userId,
        category,
        isActive: true,
        startDate: { $lte: date },
        endDate: { $gte: date },
      });

      for (const budget of budgets) {
        budget.spent += amount;
        await budget.save();

        // Check if alert threshold reached
        await this.checkBudgetAlert(budget);
      }
    } catch (error: any) {
      console.error('Failed to update budget spending:', error);
    }
  }

  /**
   * Check if budget alert should be sent
   */
  private async checkBudgetAlert(budget: IBudget): Promise<void> {
    try {
      const percentageUsed = (budget.spent / budget.amount) * 100;

      // Send alerts at threshold and 100%
      if (percentageUsed >= budget.alertThreshold && percentageUsed < 100) {
        await Notification.create({
          userId: budget.userId,
          type: NotificationType.BUDGET_THRESHOLD,
          title: `Budget Alert: ${budget.name}`,
          message: `You've used ${percentageUsed.toFixed(
            0
          )}% of your ${budget.name} budget (₹${budget.spent.toFixed(0)} of ₹${budget.amount})`,
          priority: NotificationPriority.MEDIUM,
          isRead: false,
          actionUrl: `/budgets/${budget._id}`,
          relatedResourceId: budget._id,
          relatedResourceType: 'Budget',
          expiresAt: budget.endDate,
        });
      } else if (percentageUsed >= 100) {
        await Notification.create({
          userId: budget.userId,
          type: NotificationType.BUDGET_THRESHOLD,
          title: `Budget Exceeded: ${budget.name}`,
          message: `You've exceeded your ${budget.name} budget! Spent: ₹${budget.spent.toFixed(
            0
          )} of ₹${budget.amount}`,
          priority: NotificationPriority.HIGH,
          isRead: false,
          actionUrl: `/budgets/${budget._id}`,
          relatedResourceId: budget._id,
          relatedResourceType: 'Budget',
          expiresAt: budget.endDate,
        });
      }
    } catch (error: any) {
      console.error('Failed to send budget alert:', error);
    }
  }

  /**
   * Get budgets with filters
   */
  async getBudgets(
    userId: string,
    filters: {
      isActive?: boolean;
      category?: ExpenseCategory;
      page?: number;
      limit?: number;
    }
  ): Promise<{ budgets: IBudget[]; total: number; page: number; totalPages: number }> {
    try {
      const query: any = { userId };

      if (filters.isActive !== undefined) {
        query.isActive = filters.isActive;
      }

      if (filters.category) {
        query.category = filters.category;
      }

      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const skip = (page - 1) * limit;

      const [budgets, total] = await Promise.all([
        Budget.find(query).sort({ startDate: -1 }).skip(skip).limit(limit),
        Budget.countDocuments(query),
      ]);

      return {
        budgets,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error: any) {
      throw new Error(`Failed to fetch budgets: ${error.message}`);
    }
  }

  /**
   * Get active budgets
   */
  async getActiveBudgets(userId: string): Promise<IBudget[]> {
    try {
      const now = new Date();

      const budgets = await Budget.find({
        userId,
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now },
      }).sort({ category: 1 });

      return budgets;
    } catch (error: any) {
      throw new Error(`Failed to fetch active budgets: ${error.message}`);
    }
  }

  /**
   * Get budget by ID
   */
  async getBudgetById(userId: string, budgetId: string): Promise<IBudget> {
    try {
      const budget = await Budget.findOne({ _id: budgetId, userId });

      if (!budget) {
        throw new Error('Budget not found');
      }

      return budget;
    } catch (error: any) {
      throw new Error(`Failed to fetch budget: ${error.message}`);
    }
  }

  /**
   * Update budget
   */
  async updateBudget(
    userId: string,
    budgetId: string,
    data: {
      name?: string;
      amount?: number;
      alertThreshold?: number;
      isActive?: boolean;
      notes?: string;
    },
    ipAddress: string,
    userAgent: string
  ): Promise<IBudget> {
    try {
      const budget = await Budget.findOne({ _id: budgetId, userId });

      if (!budget) {
        throw new Error('Budget not found');
      }

      // Update fields
      if (data.name) budget.name = data.name;
      if (data.amount) budget.amount = data.amount;
      if (data.alertThreshold !== undefined) budget.alertThreshold = data.alertThreshold;
      if (data.isActive !== undefined) budget.isActive = data.isActive;
      if (data.notes !== undefined) budget.notes = data.notes;

      await budget.save();

      // Audit log
      await AuditLog.log({
        userId: new mongoose.Types.ObjectId(userId),
        action: AuditAction.BUDGET_UPDATE,
        resource: 'Budget',
        resourceId: budget._id,
        details: { changes: data },
        ipAddress,
        userAgent,
        statusCode: 200,
      });

      return budget;
    } catch (error: any) {
      throw new Error(`Failed to update budget: ${error.message}`);
    }
  }

  /**
   * Delete budget
   */
  async deleteBudget(
    userId: string,
    budgetId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    try {
      const budget = await Budget.findOne({ _id: budgetId, userId });

      if (!budget) {
        throw new Error('Budget not found');
      }

      await Budget.findByIdAndDelete(budgetId);

      // Audit log
      await AuditLog.log({
        userId: new mongoose.Types.ObjectId(userId),
        action: AuditAction.BUDGET_DELETE,
        resource: 'Budget',
        resourceId: budget._id,
        details: {
          name: budget.name,
          category: budget.category,
        },
        ipAddress,
        userAgent,
        statusCode: 200,
      });
    } catch (error: any) {
      throw new Error(`Failed to delete budget: ${error.message}`);
    }
  }

  /**
   * Get budget summary
   */
  async getBudgetSummary(userId: string): Promise<{
    totalBudgeted: number;
    totalSpent: number;
    totalRemaining: number;
    activeBudgets: number;
    exceededBudgets: number;
  }> {
    try {
      const now = new Date();
      const budgets = await Budget.find({
        userId,
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now },
      });

      let totalBudgeted = 0;
      let totalSpent = 0;
      let exceededBudgets = 0;

      budgets.forEach((budget) => {
        totalBudgeted += budget.amount;
        totalSpent += budget.spent;

        if (budget.spent > budget.amount) {
          exceededBudgets++;
        }
      });

      return {
        totalBudgeted,
        totalSpent,
        totalRemaining: Math.max(0, totalBudgeted - totalSpent),
        activeBudgets: budgets.length,
        exceededBudgets,
      };
    } catch (error: any) {
      throw new Error(`Failed to get budget summary: ${error.message}`);
    }
  }
}
