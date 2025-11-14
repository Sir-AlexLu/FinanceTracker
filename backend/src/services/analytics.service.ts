import { Transaction } from '../models/Transaction';
import { Account } from '../models/Account';
import { Budget } from '../models/Budget';
import { Goal } from '../models/Goal';
import { Liability } from '../models/Liability';
import { Bill } from '../models/Bill';
import { AccountService } from './account.service';
import { LiabilityService } from './liability.service';
import { BudgetService } from './budget.service';
import { GoalService } from './goal.service';
import { BillService } from './bill.service';
import { TransactionType, IncomeCategory, ExpenseCategory } from '../types/models.types';
import { getMonthStart, getMonthEnd, addMonths, addDays } from '../utils/dateHelpers';

export class AnalyticsService {
  private accountService: AccountService;
  private liabilityService: LiabilityService;
  private budgetService: BudgetService;
  private goalService: GoalService;
  private billService: BillService;

  constructor() {
    this.accountService = new AccountService();
    this.liabilityService = new LiabilityService();
    this.budgetService = new BudgetService();
    this.goalService = new GoalService();
    this.billService = new BillService();
  }

  /**
   * Get dashboard overview
   */
  async getDashboardOverview(userId: string): Promise<any> {
    try {
      const now = new Date();
      const monthStart = getMonthStart(now);
      const monthEnd = getMonthEnd(now);

      // Get all data in parallel
      const [
        accountsSummary,
        monthlyTransactions,
        liabilitySummary,
        budgetSummary,
        goalSummary,
        upcomingBills,
      ] = await Promise.all([
        this.accountService.getAccountsSummary(userId),
        Transaction.find({
          userId,
          date: { $gte: monthStart, $lte: monthEnd },
        }),
        this.liabilityService.getLiabilitySummary(userId),
        this.budgetService.getBudgetSummary(userId),
        this.goalService.getGoalSummary(userId),
        this.billService.getUpcomingBills(userId),
      ]);

      // Calculate monthly stats
      let monthlyIncome = 0;
      let monthlyExpenses = 0;

      monthlyTransactions.forEach((t) => {
        if (t.type === TransactionType.INCOME) {
          monthlyIncome += t.amount;
        } else if (t.type === TransactionType.EXPENSE && !t.isLiabilityPayment) {
          monthlyExpenses += t.amount;
        }
      });

      const netCashFlow = monthlyIncome - monthlyExpenses;
      const savingsRate = monthlyIncome > 0 ? (netCashFlow / monthlyIncome) * 100 : 0;

      return {
        overview: {
          totalBalance: accountsSummary.total,
          monthlyIncome,
          monthlyExpenses,
          netCashFlow,
          savingsRate: Math.max(0, savingsRate),
        },
        accounts: accountsSummary,
        liabilities: liabilitySummary,
        budgets: budgetSummary,
        goals: goalSummary,
        upcomingBills: upcomingBills.slice(0, 5), // Top 5
        recentTransactions: monthlyTransactions.slice(0, 10), // Latest 10
      };
    } catch (error: any) {
      throw new Error(`Failed to get dashboard overview: ${error.message}`);
    }
  }

  /**
   * Get income vs expenses comparison
   */
  async getIncomeVsExpenses(
    userId: string,
    months: number = 6
  ): Promise<{
    labels: string[];
    income: number[];
    expenses: number[];
    net: number[];
  }> {
    try {
      const labels: string[] = [];
      const income: number[] = [];
      const expenses: number[] = [];
      const net: number[] = [];

      const now = new Date();

      for (let i = months - 1; i >= 0; i--) {
        const monthDate = addMonths(now, -i);
        const monthStart = getMonthStart(monthDate);
        const monthEnd = getMonthEnd(monthDate);

        const monthLabel = monthDate.toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric',
        });

        const transactions = await Transaction.find({
          userId,
          date: { $gte: monthStart, $lte: monthEnd },
        });

        let monthIncome = 0;
        let monthExpenses = 0;

        transactions.forEach((t) => {
          if (t.type === TransactionType.INCOME) {
            monthIncome += t.amount;
          } else if (t.type === TransactionType.EXPENSE && !t.isLiabilityPayment) {
            monthExpenses += t.amount;
          }
        });

        labels.push(monthLabel);
        income.push(monthIncome);
        expenses.push(monthExpenses);
        net.push(monthIncome - monthExpenses);
      }

      return { labels, income, expenses, net };
    } catch (error: any) {
      throw new Error(`Failed to get income vs expenses: ${error.message}`);
    }
  }

  /**
   * Get category-wise spending breakdown
   */
  async getCategoryBreakdown(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    labels: string[];
    values: number[];
    percentages: number[];
  }> {
    try {
      const start = startDate || getMonthStart(new Date());
      const end = endDate || getMonthEnd(new Date());

      const transactions = await Transaction.find({
        userId,
        type: TransactionType.EXPENSE,
        isLiabilityPayment: false,
        date: { $gte: start, $lte: end },
      });

      const categoryTotals: Record<string, number> = {};

      transactions.forEach((t) => {
        if (t.expenseCategory) {
          categoryTotals[t.expenseCategory] =
            (categoryTotals[t.expenseCategory] || 0) + t.amount;
        }
      });

      const total = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);

      const labels = Object.keys(categoryTotals);
      const values = Object.values(categoryTotals);
      const percentages = values.map((val) => (total > 0 ? (val / total) * 100 : 0));

      return { labels, values, percentages };
    } catch (error: any) {
      throw new Error(`Failed to get category breakdown: ${error.message}`);
    }
  }

  /**
   * Get spending trends
   */
  async getSpendingTrends(
    userId: string,
    days: number = 30
  ): Promise<{
    labels: string[];
    values: number[];
    average: number;
  }> {
    try {
      const labels: string[] = [];
      const values: number[] = [];

      const now = new Date();

      for (let i = days - 1; i >= 0; i--) {
        const date = addDays(now, -i);
        const dayStart = new Date(date.setHours(0, 0, 0, 0));
        const dayEnd = new Date(date.setHours(23, 59, 59, 999));

        const dayLabel = date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });

        const transactions = await Transaction.find({
          userId,
          type: TransactionType.EXPENSE,
          isLiabilityPayment: false,
          date: { $gte: dayStart, $lte: dayEnd },
        });

        const dayTotal = transactions.reduce((sum, t) => sum + t.amount, 0);

        labels.push(dayLabel);
        values.push(dayTotal);
      }

      const average = values.reduce((sum, val) => sum + val, 0) / values.length;

      return { labels, values, average };
    } catch (error: any) {
      throw new Error(`Failed to get spending trends: ${error.message}`);
    }
  }

  /**
   * Get financial insights
   */
  async getFinancialInsights(userId: string): Promise<any[]> {
    try {
      const insights: any[] = [];

      const now = new Date();
      const monthStart = getMonthStart(now);
      const monthEnd = getMonthEnd(now);
      const lastMonthStart = getMonthStart(addMonths(now, -1));
      const lastMonthEnd = getMonthEnd(addMonths(now, -1));

      // Get current and last month transactions
      const [currentMonth, lastMonth] = await Promise.all([
        Transaction.find({
          userId,
          date: { $gte: monthStart, $lte: monthEnd },
        }),
        Transaction.find({
          userId,
          date: { $gte: lastMonthStart, $lte: lastMonthEnd },
        }),
      ]);

      // Calculate totals
      const currentExpenses = currentMonth
        .filter((t) => t.type === TransactionType.EXPENSE && !t.isLiabilityPayment)
        .reduce((sum, t) => sum + t.amount, 0);

      const lastExpenses = lastMonth
        .filter((t) => t.type === TransactionType.EXPENSE && !t.isLiabilityPayment)
        .reduce((sum, t) => sum + t.amount, 0);

      // Spending comparison
      if (currentExpenses > lastExpenses * 1.2) {
        const increase = ((currentExpenses - lastExpenses) / lastExpenses) * 100;
        insights.push({
          type: 'warning',
          title: 'Spending Spike Detected',
          message: `Your spending increased by ${increase.toFixed(
            0
          )}% compared to last month (₹${currentExpenses.toFixed(0)} vs ₹${lastExpenses.toFixed(
            0
          )})`,
          priority: 'high',
        });
      } else if (currentExpenses < lastExpenses * 0.8) {
        const decrease = ((lastExpenses - currentExpenses) / lastExpenses) * 100;
        insights.push({
          type: 'success',
          title: 'Great Savings!',
          message: `You saved ${decrease.toFixed(
            0
          )}% compared to last month (₹${currentExpenses.toFixed(0)} vs ₹${lastExpenses.toFixed(
            0
          )})`,
          priority: 'medium',
        });
      }

      // Budget alerts
      const budgets = await this.budgetService.getActiveBudgets(userId);
      const exceededBudgets = budgets.filter((b) => b.spent > b.amount);

      if (exceededBudgets.length > 0) {
        insights.push({
          type: 'warning',
          title: 'Budget Exceeded',
          message: `You've exceeded ${exceededBudgets.length} budget${
            exceededBudgets.length > 1 ? 's' : ''
          } this month`,
          priority: 'high',
        });
      }

      // Upcoming bills
      const upcomingBills = await this.billService.getUpcomingBills(userId);
      const overdueBills = upcomingBills.filter((b) => b.status === 'overdue');

      if (overdueBills.length > 0) {
        insights.push({
          type: 'error',
          title: 'Overdue Bills',
          message: `You have ${overdueBills.length} overdue bill${
            overdueBills.length > 1 ? 's' : ''
          }`,
          priority: 'high',
        });
      }

      // Goal progress
      const goalSummary = await this.goalService.getGoalSummary(userId);
      if (goalSummary.activeGoals > 0 && goalSummary.overallProgress > 0) {
        insights.push({
          type: 'info',
          title: 'Goal Progress',
          message: `You're ${goalSummary.overallProgress.toFixed(
            0
          )}% towards your financial goals. Keep going!`,
          priority: 'medium',
        });
      }

      return insights;
    } catch (error: any) {
      throw new Error(`Failed to get financial insights: ${error.message}`);
    }
  }
}
