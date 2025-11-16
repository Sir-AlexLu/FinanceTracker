// src/services/transaction.service.ts
import { Transaction, ITransaction } from '../models/Transaction.js';
import { Account } from '../models/Account.js';
import { logger } from '../utils/logger.js';
import { formatSettlementPeriod } from '../utils/dateHelpers.js';
import type { TransactionType } from '../types/models.types.js';

// Assuming mongoose is imported globally or in a common file, 
// otherwise it would need: import mongoose from 'mongoose';
// This is inferred from the code's use of `mongoose.startSession()`
import mongoose from 'mongoose';

// Assuming these types are defined elsewhere, e.g., in a types file
// This is inferred from their use as parameters
type CreateTransactionInput = any; 
type UpdateTransactionInput = any;

export class TransactionService {
  private accountService = new import('./account.service.js').AccountService();
  private budgetService = new import('./budget.service.js').BudgetService();
  private goalService = new import('./goal.service.js').GoalService();
  private liabilityService = new import('./liability.service.js').LiabilityService();

  async create(userId: string, data: CreateTransactionInput, ip: string, ua: string): Promise<ITransaction> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const account = await Account.findOne({ _id: data.accountId, userId, isActive: true });
      if (!account) throw new Error('Account not found');

      if (data.type === TransactionType.TRANSFER) {
        const dest = await Account.findOne({ _id: data.destinationAccountId, userId, isActive: true });
        if (!dest) throw new Error('Destination account not found');
      }

      const date = data.date ? new Date(data.date) : new Date();
      const settlement = formatSettlementPeriod(date, 'monthly');

      const tx = await Transaction.create([{
        ...data,
        userId,
        date,
        settlementPeriod: settlement,
        isSettled: false,
      }], { session });

      await this.updateBalances(tx[0], 'create', session);
      await session.commitTransaction();

      // Async side effects
      this.updateBudgetAsync(userId, tx[0]);
      this.updateGoalsAsync(userId, tx[0]);

      // --- ADDED CODE BLOCK ---
      if (data.isLiabilityPayment && data.liabilityId) {
        await this.liabilityService.makePayment(userId, data.liabilityId.toString(), {
          amount: data.amount,
          accountId: data.accountId,
          notes: data.notes,
        }, ip, ua).catch(() => {});
      }
      // --- END ADDED CODE BLOCK ---

      logger.info({ userId, txId: tx[0]._id, type: tx[0].type, amount: tx[0].amount, ip, ua }, 'Transaction created');
      return tx[0];
    } catch (err: any) {
      await session.abortTransaction();
      throw new Error(`Create failed: ${err.message}`);
    } finally {
      session.endSession();
    }
  }

  private async updateBalances(tx: ITransaction, op: 'create' | 'delete', session?: any) {
    const mul = op === 'create' ? 1 : -1;
    const updates = { $inc: {}, $set: { 'metadata.lastTransactionAt': new Date() } };

    switch (tx.type) {
      case TransactionType.INCOME:
      case TransactionType.LIABILITY:
        updates.$inc = { balance: tx.amount * mul };
        await Account.findByIdAndUpdate(tx.accountId, updates, { session });
        break;
      case TransactionType.EXPENSE:
        updates.$inc = { balance: -tx.amount * mul };
        await Account.findByIdAndUpdate(tx.accountId, updates, { session });
        break;
      case TransactionType.TRANSFER:
        await Account.findByIdAndUpdate(tx.accountId, { $inc: { balance: -tx.amount * mul }, ...updates.$set }, { session });
        await Account.findByIdAndUpdate(tx.destinationAccountId, { $inc: { balance: tx.amount * mul }, ...updates.$set }, { session });
        break;
    }
  }

  private updateBudgetAsync(userId: string, tx: ITransaction) {
    if (tx.type === TransactionType.EXPENSE && tx.expenseCategory && !tx.isLiabilityPayment) {
      this.budgetService.updateSpending(userId, tx.expenseCategory, tx.amount, tx.date).catch(err =>
        logger.error({ userId, txId: tx._id, err }, 'Budget update failed'));
    }
  }

  private async updateGoalsAsync(userId: string, tx: ITransaction) {
    const accounts = [tx.accountId];
    if (tx.destinationAccountId) accounts.push(tx.destinationAccountId);

    // Updated to use async/await in a loop for cleaner error handling
    for (const id of accounts) {
      try {
        await this.goalService.updateLinkedGoals(userId, id.toString());
      } catch (err) {
        logger.error({ userId, accountId: id, err }, 'Goal update failed');
      }
    }
  }

  async getAll(userId: string, filters: any) {
    const query: any = { userId };
    if (filters.type) query.type = filters.type;
    if (filters.accountId) query.$or = [{ accountId: filters.accountId }, { destinationAccountId: filters.accountId }];
    if (filters.startDate || filters.endDate) {
      query.date = {};
      if (filters.startDate) query.date.$gte = new Date(filters.startDate);
      if (filters.endDate) query.date.$lte = new Date(filters.endDate);
    }

    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100);
    const skip = (page - 1) * limit;

    const [txs, total] = await Promise.all([
      Transaction.find(query).sort({ date: -1 }).skip(skip).limit(limit)
        .populate('accountId', 'name type').populate('destinationAccountId', 'name type'),
      Transaction.countDocuments(query)
    ]);

    return { transactions: txs, total, page, totalPages: Math.ceil(total / limit) };
  }

  async update(userId: string, id: string, data: UpdateTransactionInput, ip: string, ua: string): Promise<ITransaction> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const tx = await Transaction.findOne({ _id: id, userId }).session(session);
      if (!tx) throw new Error('Not found');
      if (tx.isSettled) throw new Error('Cannot update settled transaction');

      const oldAmt = tx.amount;

      if (data.amount && data.amount !== tx.amount) {
        await this.updateBalances(tx, 'delete', session);
        tx.amount = data.amount;
        await this.updateBalances(tx, 'create', session);
      }

      if (data.date) {
        tx.date = new Date(data.date);
        tx.settlementPeriod = formatSettlementPeriod(tx.date, 'monthly');
      }
      if (data.description) tx.description = data.description;
      if (data.notes !== undefined) tx.notes = data.notes;
      if (data.tags) tx.tags = data.tags;

      await tx.save({ session });
      await session.commitTransaction();

      if (data.amount && tx.type === TransactionType.EXPENSE && tx.expenseCategory) {
        this.budgetService.updateSpending(userId, tx.expenseCategory, -oldAmt, tx.date).catch(() => {});
        this.budgetService.updateSpending(userId, tx.expenseCategory, tx.amount, tx.date).catch(() => {});
      }

      logger.info({ userId, txId: id, changes: data, ip, ua }, 'Transaction updated');
      return tx;
    } catch (err: any) {
      await session.abortTransaction();
      throw new Error(`Update failed: ${err.message}`);
    } finally {
      session.endSession();
    }
  }

  async delete(userId: string, id: string, ip: string, ua: string): Promise<void> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const tx = await Transaction.findOne({ _id: id, userId }).session(session);
      if (!tx) throw new Error('Not found');
      if (tx.isSettled) throw new Error('Cannot delete settled');

      await this.updateBalances(tx, 'delete', session);
      await Transaction.findByIdAndDelete(id).session(session);
      await session.commitTransaction();

      this.updateBudgetAsync(userId, tx);
      this.updateGoalsAsync(userId, tx);

      logger.info({ userId, txId: id, ip, ua }, 'Transaction deleted');
    } catch (err: any) {
      await session.abortTransaction();
      throw new Error(`Delete failed: ${err.message}`);
    } finally {
      session.endSession();
    }
  }
}
