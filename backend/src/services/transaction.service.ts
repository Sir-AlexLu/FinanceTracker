import { Transaction, ITransaction } from '../models/Transaction';
import { Account } from '../models/Account';
import { AuditLog, AuditAction } from '../models/AuditLog';
import { AccountService } from './account.service';
import { TransactionType } from '../types/models.types';
import { formatSettlementPeriod } from '../utils/dateHelpers';
import mongoose from 'mongoose';

export class TransactionService {
  private accountService: AccountService;

  constructor() {
    this.accountService = new AccountService();
  }

  /**
   * Create a new transaction
   */
  async createTransaction(
    userId: string,
    data: {
      type: TransactionType;
      incomeCategory?: string;
      expenseCategory?: string;
      amount: number;
      accountId: string;
      destinationAccountId?: string;
      description: string;
      date?: string;
      notes?: string;
      tags?: string[];
      isRecurring?: boolean;
      recurringConfig?: any;
    },
    ipAddress: string,
    userAgent: string
  ): Promise<ITransaction> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Verify account ownership
      const account = await Account.findOne({
        _id: data.accountId,
        userId,
        isActive: true,
      });

      if (!account) {
        throw new Error('Account not found or inactive');
      }

      // Verify destination account for transfers
      if (data.type === TransactionType.TRANSFER) {
        const destinationAccount = await Account.findOne({
          _id: data.destinationAccountId,
          userId,
          isActive: true,
        });

        if (!destinationAccount) {
          throw new Error('Destination account not found or inactive');
        }
      }

      // Calculate settlement period
      const transactionDate = data.date ? new Date(data.date) : new Date();
      const settlementPeriod = formatSettlementPeriod(transactionDate, 'monthly');

      // Create transaction
      const transactionData: any = {
        userId,
        type: data.type,
        incomeCategory: data.incomeCategory,
        expenseCategory: data.expenseCategory,
        amount: data.amount,
        accountId: data.accountId,
        destinationAccountId: data.destinationAccountId,
        description: data.description,
        date: transactionDate,
        notes: data.notes,
        tags: data.tags,
        isRecurring: data.isRecurring || false,
        recurringConfig: data.recurringConfig,
        settlementPeriod,
        isSettled: false,
      };

      const transaction = await Transaction.create([transactionData], { session });

      // Update account balances
      await this.updateAccountBalances(transaction[0], 'create', session);

      await session.commitTransaction();

      // Audit log
      await AuditLog.log({
        userId: new mongoose.Types.ObjectId(userId),
        action: AuditAction.TRANSACTION_CREATE,
        resource: 'Transaction',
        resourceId: transaction[0]._id,
        details: {
          type: transaction[0].type,
          amount: transaction[0].amount,
          description: transaction[0].description,
        },
        ipAddress,
        userAgent,
        statusCode: 201,
      });

      return transaction[0];
    } catch (error: any) {
      await session.abortTransaction();
      throw new Error(`Failed to create transaction: ${error.message}`);
    } finally {
      session.endSession();
    }
  }

  /**
   * Update account balances based on transaction
   */
  private async updateAccountBalances(
    transaction: ITransaction,
    operation: 'create' | 'delete',
    session?: any
  ): Promise<void> {
    const multiplier = operation === 'create' ? 1 : -1;

    switch (transaction.type) {
      case TransactionType.INCOME:
        // Increase account balance
        await Account.findByIdAndUpdate(
          transaction.accountId,
          {
            $inc: { balance: transaction.amount * multiplier },
            $set: { 'metadata.lastTransactionAt': new Date() },
          },
          { session }
        );
        break;

      case TransactionType.EXPENSE:
        // Decrease account balance
        await Account.findByIdAndUpdate(
          transaction.accountId,
          {
            $inc: { balance: -transaction.amount * multiplier },
            $set: { 'metadata.lastTransactionAt': new Date() },
          },
          { session }
        );
        break;

      case TransactionType.TRANSFER:
        // Decrease source account
        await Account.findByIdAndUpdate(
          transaction.accountId,
          {
            $inc: { balance: -transaction.amount * multiplier },
            $set: { 'metadata.lastTransactionAt': new Date() },
          },
          { session }
        );

        // Increase destination account
        await Account.findByIdAndUpdate(
          transaction.destinationAccountId,
          {
            $inc: { balance: transaction.amount * multiplier },
            $set: { 'metadata.lastTransactionAt': new Date() },
          },
          { session }
        );
        break;

      case TransactionType.LIABILITY:
        // Increase account balance (receiving borrowed money)
        await Account.findByIdAndUpdate(
          transaction.accountId,
          {
            $inc: { balance: transaction.amount * multiplier },
            $set: { 'metadata.lastTransactionAt': new Date() },
          },
          { session }
        );
        break;
    }
  }

  /**
   * Get transactions with filters
   */
  async getTransactions(
    userId: string,
    filters: {
      type?: TransactionType;
      accountId?: string;
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{ transactions: ITransaction[]; total: number; page: number; totalPages: number }> {
    try {
      const query: any = { userId };

      if (filters.type) query.type = filters.type;
      if (filters.accountId) {
        query.$or = [
          { accountId: filters.accountId },
          { destinationAccountId: filters.accountId },
        ];
      }
      if (filters.startDate || filters.endDate) {
        query.date = {};
        if (filters.startDate) query.date.$gte = new Date(filters.startDate);
        if (filters.endDate) query.date.$lte = new Date(filters.endDate);
      }

      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const skip = (page - 1) * limit;

      const [transactions, total] = await Promise.all([
        Transaction.find(query)
          .sort({ date: -1 })
          .skip(skip)
          .limit(limit)
          .populate('accountId', 'name type')
          .populate('destinationAccountId', 'name type'),
        Transaction.countDocuments(query),
      ]);

      return {
        transactions,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error: any) {
      throw new Error(`Failed to fetch transactions: ${error.message}`);
    }
  }

  /**
   * Get transaction by ID
   */
  async getTransactionById(userId: string, transactionId: string): Promise<ITransaction> {
    try {
      const transaction = await Transaction.findOne({
        _id: transactionId,
        userId,
      })
        .populate('accountId', 'name type')
        .populate('destinationAccountId', 'name type');

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      return transaction;
    } catch (error: any) {
      throw new Error(`Failed to fetch transaction: ${error.message}`);
    }
  }

  /**
   * Update transaction
   */
  async updateTransaction(
    userId: string,
    transactionId: string,
    data: {
      amount?: number;
      description?: string;
      date?: string;
      notes?: string;
      tags?: string[];
    },
    ipAddress: string,
    userAgent: string
  ): Promise<ITransaction> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const transaction = await Transaction.findOne({
        _id: transactionId,
        userId,
      }).session(session);

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      // Check if transaction is already settled
      if (transaction.isSettled) {
        throw new Error('Cannot update a settled transaction');
      }

      // If amount changed, revert old balance and apply new
      if (data.amount && data.amount !== transaction.amount) {
        // Revert old transaction
        await this.updateAccountBalances(transaction, 'delete', session);

        // Update amount
        transaction.amount = data.amount;

        // Apply new transaction
        await this.updateAccountBalances(transaction, 'create', session);
      }

      // Update other fields
      if (data.description) transaction.description = data.description;
      if (data.date) {
        transaction.date = new Date(data.date);
        transaction.settlementPeriod = formatSettlementPeriod(transaction.date, 'monthly');
      }
      if (data.notes !== undefined) transaction.notes = data.notes;
      if (data.tags) transaction.tags = data.tags;

      await transaction.save({ session });

      await session.commitTransaction();

      // Audit log
      await AuditLog.log({
        userId: new mongoose.Types.ObjectId(userId),
        action: AuditAction.TRANSACTION_UPDATE,
        resource: 'Transaction',
        resourceId: transaction._id,
        details: {
          changes: data,
        },
        ipAddress,
        userAgent,
        statusCode: 200,
      });

      return transaction;
    } catch (error: any) {
      await session.abortTransaction();
      throw new Error(`Failed to update transaction: ${error.message}`);
    } finally {
      session.endSession();
    }
  }

  /**
   * Delete transaction
   */
  async deleteTransaction(
    userId: string,
    transactionId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const transaction = await Transaction.findOne({
        _id: transactionId,
        userId,
      }).session(session);

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      // Check if transaction is already settled
      if (transaction.isSettled) {
        throw new Error('Cannot delete a settled transaction');
      }

      // Revert account balances
      await this.updateAccountBalances(transaction, 'delete', session);

      // Delete transaction
      await Transaction.findByIdAndDelete(transactionId).session(session);

      await session.commitTransaction();

      // Audit log
      await AuditLog.log({
        userId: new mongoose.Types.ObjectId(userId),
        action: AuditAction.TRANSACTION_DELETE,
        resource: 'Transaction',
        resourceId: transaction._id,
        details: {
          type: transaction.type,
          amount: transaction.amount,
          description: transaction.description,
        },
        ipAddress,
        userAgent,
        statusCode: 200,
      });
    } catch (error: any) {
      await session.abortTransaction();
      throw new Error(`Failed to delete transaction: ${error.message}`);
    } finally {
      session.endSession();
    }
  }

  /**
   * Get transaction statistics
   */
  async getTransactionStats(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalIncome: number;
    totalExpenses: number;
    totalTransfers: number;
    netCashFlow: number;
    transactionCount: number;
  }> {
    try {
      const transactions = await Transaction.find({
        userId,
        date: { $gte: startDate, $lte: endDate },
      });

      let totalIncome = 0;
      let totalExpenses = 0;
      let totalTransfers = 0;

      transactions.forEach((transaction) => {
        switch (transaction.type) {
          case TransactionType.INCOME:
            totalIncome += transaction.amount;
            break;
          case TransactionType.EXPENSE:
            if (!transaction.isLiabilityPayment) {
              totalExpenses += transaction.amount;
            }
            break;
          case TransactionType.TRANSFER:
            totalTransfers += transaction.amount;
            break;
        }
      });

      return {
        totalIncome,
        totalExpenses,
        totalTransfers,
        netCashFlow: totalIncome - totalExpenses,
        transactionCount: transactions.length,
      };
    } catch (error: any) {
      throw new Error(`Failed to get transaction stats: ${error.message}`);
    }
  }
}
