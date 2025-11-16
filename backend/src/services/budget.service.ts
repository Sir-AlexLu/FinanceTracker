// src/services/budget.service.ts
import { Budget, IBudget } from '../models/Budget.js';
import { Transaction } from '../models/Transaction.js';
import { Notification } from '../models/Notification.js';
import { logger } from '../utils/logger.js';
import type { ExpenseCategory } from '../types/models.types.js';

export class BudgetService {
  async create(userId: string, data: CreateBudgetInput, ip: string, ua: string): Promise<IBudget> {
    const start = new Date(data.startDate);
    const end = this.getEndDate(start, data.period);

    const spent = await this.calcSpending(userId, data.category, start, end);

    const budget = await Budget.create({
      userId,
      ...data,
      startDate: start,
      endDate: end,
      spent,
    });

    await this.checkAlert(budget);
    logger.info({ userId, budgetId: budget._id, ip, ua }, 'Budget created');
    return budget;
  }

  private getEndDate(start: Date, period: string): Date {
    const end = new Date(start);
    if (period === 'weekly') end.setDate(end.getDate() + 7);
    if (period === 'monthly') end.setMonth(end.getMonth() + 1);
    if (period === 'yearly') end.setFullYear(end.getFullYear() + 1);
    return end;
  }

  private async calcSpending(userId: string, category: ExpenseCategory, start: Date, end: Date): Promise<number> {
    const txs = await Transaction.find({
      userId,
      type: 'EXPENSE',
      expenseCategory: category,
      date: { $gte: start, $lte: end },
      isLiabilityPayment: false,
    });
    return txs.reduce((sum, t) => sum + t.amount, 0);
  }

  async updateSpending(userId: string, category: ExpenseCategory, amount: number, date: Date): Promise<void> {
    const budgets = await Budget.find({
      userId,
      category,
      isActive: true,
      startDate: { $lte: date },
      endDate: { $gte: date },
    });

    for (const b of budgets) {
      b.spent += amount;
      await b.save();
      await this.checkAlert(b);
    }
  }

  private async checkAlert(budget: IBudget): Promise<void> {
    const pct = (budget.spent / budget.amount) * 100;
    if (pct < budget.alertThreshold) return;

    const isExceeded = pct >= 100;
    await Notification.create({
      userId: budget.userId,
      type: 'BUDGET_THRESHOLD',
      title: isExceeded ? `Budget Exceeded: ${budget.name}` : `Budget Alert: ${budget.name}`,
      message: isExceeded
        ? `You've exceeded your ${budget.name} budget! Spent: ₹${budget.spent.toFixed(0)} of ₹${budget.amount}`
        : `You've used ${pct.toFixed(0)}% of your ${budget.name} budget (₹${budget.spent.toFixed(0)} of ₹${budget.amount})`,
      priority: isExceeded ? 'HIGH' : 'MEDIUM',
      isRead: false,
      actionUrl: `/budgets/${budget._id}`,
      relatedResourceId: budget._id,
      relatedResourceType: 'Budget',
      expiresAt: budget.endDate,
    });
  }

  async getAll(userId: string, filters: any) {
    const query: any = { userId };
    if (filters.isActive !== undefined) query.isActive = filters.isActive;
    if (filters.category) query.category = filters.category;

    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100);
    const skip = (page - 1) * limit;

    const [budgets, total] = await Promise.all([
      Budget.find(query).sort({ startDate: -1 }).skip(skip).limit(limit),
      Budget.countDocuments(query),
    ]);

    return { budgets, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getActive(userId: string): Promise<IBudget[]> {
    const now = new Date();
    return Budget.find({
      userId,
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    }).sort({ category: 1 });
  }

  async getById(userId: string, id: string): Promise<IBudget> {
    const budget = await Budget.findOne({ _id: id, userId });
    if (!budget) throw new Error('Budget not found');
    return budget;
  }

  async update(userId: string, id: string, data: UpdateBudgetInput, ip: string, ua: string): Promise<IBudget> {
    const budget = await Budget.findOne({ _id: id, userId });
    if (!budget) throw new Error('Budget not found');

    Object.assign(budget, data);
    await budget.save();

    logger.info({ userId, budgetId: id, changes: data, ip, ua }, 'Budget updated');
    return budget;
  }

  async delete(userId: string, id: string, ip: string, ua: string): Promise<void> {
    const budget = await Budget.findOne({ _id: id, userId });
    if (!budget) throw new Error('Budget not found');

    await Budget.findByIdAndDelete(id);
    logger.info({ userId, budgetId: id, ip, ua }, 'Budget deleted');
  }

  async getSummary(userId: string) {
    const now = new Date();
    const budgets = await Budget.find({
      userId,
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    });

    const totalBudgeted = budgets.reduce((s, b) => s + b.amount, 0);
    const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
    const exceeded = budgets.filter(b => b.spent > b.amount).length;

    return {
      totalBudgeted,
      totalSpent,
      totalRemaining: Math.max(0, totalBudgeted - totalSpent),
      activeBudgets: budgets.length,
      exceededBudgets: exceeded,
    };
  }
}
