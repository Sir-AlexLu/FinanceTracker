// src/services/liability.service.ts
import { Liability, ILiability } from '../models/Liability.js';
import { TransactionService } from './transaction.service.js';
import { GoalService } from './goal.service.js';
import { Account } from '../models/Account.js';
import { logger } from '../utils/logger.js';
import type { TransactionType, ExpenseCategory } from '../types/models.types.js';

export class LiabilityService {
  private txSvc = new TransactionService();
  private goalSvc = new GoalService();

  async create(userId: string, data: CreateLiabilityInput, ip: string, ua: string): Promise<ILiability> {
    if (data.accountId) {
      const acc = await Account.findOne({ _id: data.accountId, userId, isActive: true });
      if (!acc) throw new Error('Account not found');
    }

    const now = new Date();
    const settlementPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const liability = await Liability.create({
      userId,
      ...data,
      paidAmount: 0,
      remainingAmount: data.totalAmount,
      createdDate: now,
      settlementPeriod,
      status: 'active',
      payments: [],
    });

    logger.info({ userId, liabilityId: liability._id, ip, ua }, 'Liability created');
    return liability;
  }

  async makePayment(
    userId: string,
    id: string,
    data: MakeLiabilityPaymentInput,
    ip: string,
    ua: string
  ): Promise<{ liability: ILiability; transaction: any }> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const liability = await Liability.findOne({ _id: id, userId }).session(session);
      if (!liability) throw new Error('Liability not found');
      if (liability.status === 'fully_paid') throw new Error('Already paid');

      if (data.amount > liability.remainingAmount)
        throw new Error(`Amount exceeds remaining: ${liability.remainingAmount}`);

      const account = await Account.findOne({ _id: data.accountId, userId, isActive: true }).session(session);
      if (!account) throw new Error('Account not found');
      if (account.balance < data.amount) throw new Error(`Insufficient balance: ${account.balance}`);

      const tx = await this.txSvc.createTransaction(userId, {
        type: 'EXPENSE' as TransactionType,
        expenseCategory: 'OTHER_EXPENSE' as ExpenseCategory,
        amount: data.amount,
        accountId: data.accountId,
        description: `Payment: ${liability.description}`,
        isLiabilityPayment: true,
        liabilityId: liability._id,
        notes: data.notes || `Paid to ${liability.creditor}`,
        date: new Date(),
      }, ip, ua);

      liability.paidAmount += data.amount;
      liability.payments.push({
        transactionId: tx._id,
        amount: data.amount,
        date: new Date(),
        accountId: new mongoose.Types.ObjectId(data.accountId),
        notes: data.notes,
      });

      await liability.save({ session });
      await session.commitTransaction();

      // Update linked goals
      await this.goalSvc.updateLinkedGoals(userId, id).catch(() => {});

      logger.info({ userId, liabilityId: id, amount: data.amount, ip, ua }, 'Liability payment');
      return { liability, transaction: tx };
    } catch (err: any) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }

  async getAll(userId: string, filters: any) {
    const query: any = { userId };
    if (filters.status) query.status = filters.status;

    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100);
    const skip = (page - 1) * limit;

    const [liabilities, total] = await Promise.all([
      Liability.find(query).sort({ createdDate: -1 }).skip(skip).limit(limit).populate('accountId', 'name type'),
      Liability.countDocuments(query),
    ]);

    return { liabilities, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getById(userId: string, id: string): Promise<ILiability> {
    const liability = await Liability.findOne({ _id: id, userId }).populate('accountId', 'name type');
    if (!liability) throw new Error('Not found');
    return liability;
  }

  async update(userId: string, id: string, data: UpdateLiabilityInput, ip: string, ua: string): Promise<ILiability> {
    const liability = await Liability.findOne({ _id: id, userId });
    if (!liability) throw new Error('Not found');

    Object.assign(liability, data);
    await liability.save();

    logger.info({ userId, liabilityId: id, changes: data, ip, ua }, 'Liability updated');
    return liability;
  }

  async delete(userId: string, id: string, ip: string, ua: string): Promise<void> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const liability = await Liability.findOne({ _id: id, userId }).session(session);
      if (!liability) throw new Error('Not found');
      if (liability.paidAmount > 0) throw new Error('Cannot delete with payments');

      await Liability.findByIdAndDelete(id).session(session);
      await session.commitTransaction();

      logger.info({ userId, liabilityId: id, ip, ua }, 'Liability deleted');
    } catch (err: any) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }

  async getSummary(userId: string) {
    const liabilities = await Liability.find({ userId });
    const total = liabilities.reduce((s, l) => s + l.totalAmount, 0);
    const paid = liabilities.reduce((s, l) => s + l.paidAmount, 0);
    const active = liabilities.filter(l => ['active', 'partially_paid'].includes(l.status)).length;
    const fullyPaid = liabilities.filter(l => l.status === 'fully_paid').length;

    return { total, paid, remaining: total - paid, activeCount: active, fullyPaidCount: fullyPaid };
  }
}
