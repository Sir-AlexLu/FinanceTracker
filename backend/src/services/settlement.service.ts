import { Settlement, ISettlement } from '../models/Settlement';
import { Transaction } from '../models/Transaction';
import { Account } from '../models/Account';
import { Liability } from '../models/Liability';
import { AuditLog, AuditAction } from '../models/AuditLog';
import { TransactionType, IncomeCategory, ExpenseCategory } from '../types/models.types';
import {
  formatSettlementPeriod,
  getMonthStart,
  getMonthEnd,
  getYearStart,
  getYearEnd,
  addMonths,
} from '../utils/dateHelpers';
import mongoose from 'mongoose';

export class SettlementService {
  /**
   * Perform monthly settlement
   */
  async performMonthlySettlement(
    userId: string,
    month: Date,
    ipAddress: string,
    userAgent: string
  ): Promise<ISettlement> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const startDate = getMonthStart(month);
      const endDate = getMonthEnd(month);
      const period = formatSettlementPeriod(month, 'monthly');

      // Check if settlement already exists
      const existingSettlement = await Settlement.findOne({ userId, period });
      if (existingSettlement) {
        throw new Error('Settlement already exists for this period');
      }

      // Get all transactions for the period
      const transactions = await Transaction.find({
        userId,
        date: { $gte: startDate, $lte: endDate },
      }).session(session);

      // Calculate summary
      const summary = this.calculateSummary(transactions);

      // Get account snapshots
      const accounts = await Account.find({ userId }).session(session);
      const accountSnapshots = await this.createAccountSnapshots(
        accounts,
        transactions,
        startDate,
        endDate
      );

      // Get liability snapshots
      const liabilitySummary = await this.createLiabilitySummary(
        userId,
        period,
        startDate,
        endDate,
        session
      );

      // Calculate carry forward balance
      const carryForwardBalance = accountSnapshots.reduce(
        (sum, acc) => sum + acc.closingBalance,
        0
      );

      // Create settlement
      const settlementData = {
        userId,
        period,
        periodType: 'monthly' as const,
        startDate,
        endDate,
        summary,
        accounts: accountSnapshots,
        liabilities: liabilitySummary,
        isSettled: true,
        settledAt: new Date(),
        settledBy: 'manual' as const,
        carryForwardBalance,
      };

      const settlement = await Settlement.create([settlementData], { session });

      // Mark all transactions as settled
      await Transaction.updateMany(
        {
          userId,
          date: { $gte: startDate, $lte: endDate },
          isSettled: false,
        },
        {
          $set: { isSettled: true, settlementPeriod: period },
        },
        { session }
      );

      // Update account opening balances for next period
      const nextPeriod = formatSettlementPeriod(addMonths(month, 1), 'monthly');
      for (const accountSnapshot of accountSnapshots) {
        await Account.findByIdAndUpdate(
          accountSnapshot.accountId,
          {
            $set: {
              openingBalance: accountSnapshot.closingBalance,
              'metadata.lastSettlementDate': new Date(),
            },
          },
          { session }
        );
      }

      // Carry forward unpaid liabilities to next period
      await this.carryForwardLiabilities(
        liabilitySummary.carryForwardLiabilities,
        nextPeriod,
        period,
        session
      );

      await session.commitTransaction();

      // Audit log
      await AuditLog.log({
        userId: new mongoose.Types.ObjectId(userId),
        action: AuditAction.SETTLEMENT_EXECUTE,
        resource: 'Settlement',
        resourceId: settlement[0]._id,
        details: {
          period,
          totalIncome: summary.totalIncome,
          totalExpenses: summary.totalExpenses,
          netCashFlow: summary.netCashFlow,
        },
        ipAddress,
        userAgent,
        statusCode: 201,
      });

      return settlement[0];
    } catch (error: any) {
      await session.abortTransaction();
      throw new Error(`Failed to perform settlement: ${error.message}`);
    } finally {
      session.endSession();
    }
  }

  /**
   * Calculate transaction summary
   */
  private calculateSummary(transactions: any[]): any {
    const summary = {
      totalIncome: 0,
      totalExpenses: 0,
      totalTransfers: 0,
      netCashFlow: 0,
      incomeByCategory: {} as Record<string, number>,
      expensesByCategory: {} as Record<string, number>,
    };

    // Initialize categories
    Object.values(IncomeCategory).forEach((cat) => {
      summary.incomeByCategory[cat] = 0;
    });
    Object.values(ExpenseCategory).forEach((cat) => {
      summary.expensesByCategory[cat] = 0;
    });

    transactions.forEach((transaction) => {
      switch (transaction.type) {
        case TransactionType.INCOME:
          summary.totalIncome += transaction.amount;
          if (transaction.incomeCategory) {
            summary.incomeByCategory[transaction.incomeCategory] += transaction.amount;
          }
          break;

        case TransactionType.EXPENSE:
          if (!transaction.isLiabilityPayment) {
            summary.totalExpenses += transaction.amount;
            if (transaction.expenseCategory) {
              summary.expensesByCategory[transaction.expenseCategory] += transaction.amount;
            }
          }
          break;

        case TransactionType.TRANSFER:
          summary.totalTransfers += transaction.amount;
          break;
      }
    });

    summary.netCashFlow = summary.totalIncome - summary.totalExpenses;

    return summary;
  }

  /**
   * Create account snapshots
   */
  private async createAccountSnapshots(
    accounts: any[],
    transactions: any[],
    startDate: Date,
    endDate: Date
  ): Promise<any[]> {
    const snapshots = [];

    for (const account of accounts) {
      // Calculate total inflow and outflow for this account
      let totalInflow = 0;
      let totalOutflow = 0;

      transactions.forEach((transaction) => {
        // Inflow
        if (
          transaction.accountId.equals(account._id) &&
          transaction.type === TransactionType.INCOME
        ) {
          totalInflow += transaction.amount;
        }
        if (
          transaction.destinationAccountId?.equals(account._id) &&
          transaction.type === TransactionType.TRANSFER
        ) {
          totalInflow += transaction.amount;
        }
        if (
          transaction.accountId.equals(account._id) &&
          transaction.type === TransactionType.LIABILITY
        ) {
          totalInflow += transaction.amount;
        }

        // Outflow
        if (
          transaction.accountId.equals(account._id) &&
          transaction.type === TransactionType.EXPENSE
        ) {
          totalOutflow += transaction.amount;
        }
        if (
          transaction.accountId.equals(account._id) &&
          transaction.type === TransactionType.TRANSFER
        ) {
          totalOutflow += transaction.amount;
        }
      });

      snapshots.push({
        accountId: account._id,
        accountName: account.name,
        accountType: account.type,
        openingBalance: account.openingBalance,
        closingBalance: account.balance,
        totalInflow,
        totalOutflow,
      });
    }

    return snapshots;
  }

  /**
   * Create liability summary
   */
  private async createLiabilitySummary(
    userId: string,
    currentPeriod: string,
    startDate: Date,
    endDate: Date,
    session?: any
  ): Promise<any> {
    const allLiabilities = await Liability.find({ userId }).session(session);

    const openingLiabilities = allLiabilities
      .filter((l) => l.carriedForwardFrom && l.settlementPeriod === currentPeriod)
      .map((l) => this.createLiabilitySnapshot(l));

    const newLiabilities = allLiabilities
      .filter(
        (l) =>
          l.settlementPeriod === currentPeriod &&
          !l.carriedForwardFrom &&
          l.createdDate >= startDate &&
          l.createdDate <= endDate
      )
      .map((l) => this.createLiabilitySnapshot(l));

    const paidLiabilities = allLiabilities
      .filter(
        (l) =>
          l.settlementPeriod === currentPeriod &&
          l.status === 'fully_paid' &&
          l.payments.some((p) => p.date >= startDate && p.date <= endDate)
      )
      .map((l) => this.createLiabilitySnapshot(l));

    const carryForwardLiabilities = allLiabilities
      .filter(
        (l) =>
          l.settlementPeriod === currentPeriod &&
          (l.status === 'active' || l.status === 'partially_paid')
      )
      .map((l) => this.createLiabilitySnapshot(l));

    const totalLiabilityAmount = carryForwardLiabilities.reduce(
      (sum, l) => sum + l.totalAmount,
      0
    );
    const totalLiabilityPaid = carryForwardLiabilities.reduce((sum, l) => sum + l.paidAmount, 0);
    const totalLiabilityRemaining = carryForwardLiabilities.reduce(
      (sum, l) => sum + l.remainingAmount,
      0
    );

    return {
      openingLiabilities,
      newLiabilities,
      paidLiabilities,
      carryForwardLiabilities,
      totalLiabilityAmount,
      totalLiabilityPaid,
      totalLiabilityRemaining,
    };
  }

  /**
   * Create liability snapshot
   */
  private createLiabilitySnapshot(liability: any): any {
    return {
      liabilityId: liability._id,
      description: liability.description,
      creditor: liability.creditor,
      totalAmount: liability.totalAmount,
      paidAmount: liability.paidAmount,
      remainingAmount: liability.remainingAmount,
      status: liability.status,
    };
  }

  /**
   * Carry forward liabilities to next period
   */
  private async carryForwardLiabilities(
    liabilities: any[],
    nextPeriod: string,
    currentPeriod: string,
    session?: any
  ): Promise<void> {
    for (const liabilitySnapshot of liabilities) {
      await Liability.findByIdAndUpdate(
        liabilitySnapshot.liabilityId,
        {
          $set: {
            settlementPeriod: nextPeriod,
            carriedForwardFrom: currentPeriod,
          },
        },
        { session }
      );
    }
  }

  /**
   * Get settlements with filters
   */
  async getSettlements(
    userId: string,
    filters: {
      periodType?: 'monthly' | 'yearly';
      page?: number;
      limit?: number;
    }
  ): Promise<{ settlements: ISettlement[]; total: number; page: number; totalPages: number }> {
    try {
      const query: any = { userId };

      if (filters.periodType) {
        query.periodType = filters.periodType;
      }

      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const skip = (page - 1) * limit;

      const [settlements, total] = await Promise.all([
        Settlement.find(query).sort({ period: -1 }).skip(skip).limit(limit),
        Settlement.countDocuments(query),
      ]);

      return {
        settlements,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error: any) {
      throw new Error(`Failed to fetch settlements: ${error.message}`);
    }
  }

  /**
   * Get settlement by period
   */
  async getSettlementByPeriod(userId: string, period: string): Promise<ISettlement> {
    try {
      const settlement = await Settlement.findOne({ userId, period });

      if (!settlement) {
        throw new Error('Settlement not found for this period');
      }

      return settlement;
    } catch (error: any) {
      throw new Error(`Failed to fetch settlement: ${error.message}`);
    }
  }

  /**
   * Check if settlement is needed
   */
  async checkSettlementNeeded(userId: string): Promise<{
    needed: boolean;
    period?: string;
    message?: string;
  }> {
    try {
      const now = new Date();
      const currentPeriod = formatSettlementPeriod(now, 'monthly');

      // Check if settlement exists for current period
      const existingSettlement = await Settlement.findOne({ userId, period: currentPeriod });

      if (existingSettlement) {
        return {
          needed: false,
          message: 'Settlement already completed for current period',
        };
      }

      // Check if it's end of month (last 3 days)
      const monthEnd = getMonthEnd(now);
      const daysUntilMonthEnd = Math.ceil(
        (monthEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilMonthEnd <= 3) {
        return {
          needed: true,
          period: currentPeriod,
          message: `Settlement recommended for ${currentPeriod}. ${daysUntilMonthEnd} day(s) until month end.`,
        };
      }

      return {
        needed: false,
        message: 'Settlement not needed yet',
      };
    } catch (error: any) {
      throw new Error(`Failed to check settlement status: ${error.message}`);
    }
  }
}
