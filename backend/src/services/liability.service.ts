import { Liability, ILiability } from '../models/Liability';
import { Transaction } from '../models/Transaction';
import { Account } from '../models/Account';
import { AuditLog, AuditAction } from '../models/AuditLog';
import { TransactionService } from './transaction.service';
import { GoalService } from './goal.service'; // ADDED
import { TransactionType, ExpenseCategory } from '../types/models.types';
import { formatSettlementPeriod } from '../utils/dateHelpers';
import mongoose from 'mongoose';

export class LiabilityService {
  private transactionService: TransactionService;
  private goalService: GoalService; // ADDED

  constructor() {
    this.transactionService = new TransactionService();
    this.goalService = new GoalService(); // ADDED
  }

  /**
   * Create a new liability
   */
  async createLiability(
    userId: string,
    data: {
      description: string;
      totalAmount: number;
      creditor: string;
      accountId?: string;
      expectedPaymentDate?: string;
      notes?: string;
      tags?: string[];
    },
    ipAddress: string,
    userAgent: string
  ): Promise<ILiability> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Verify account if provided
      if (data.accountId) {
        const account = await Account.findOne({
          _id: data.accountId,
          userId,
          isActive: true,
        });

        if (!account) {
          throw new Error('Account not found or inactive');
        }
      }

      // Calculate current settlement period
      const settlementPeriod = formatSettlementPeriod(new Date(), 'monthly');

      // Create liability
      const liabilityData = {
        userId,
        description: data.description,
        totalAmount: data.totalAmount,
        paidAmount: 0,
        remainingAmount: data.totalAmount,
        creditor: data.creditor,
        accountId: data.accountId,
        createdDate: new Date(),
        expectedPaymentDate: data.expectedPaymentDate
          ? new Date(data.expectedPaymentDate)
          : undefined,
        status: 'active',
        payments: [],
        settlementPeriod,
        notes: data.notes,
        tags: data.tags,
      };

      const liability = await Liability.create([liabilityData], { session });

      await session.commitTransaction();

      // Audit log
      await AuditLog.log({
        userId: new mongoose.Types.ObjectId(userId),
        action: AuditAction.LIABILITY_CREATE,
        resource: 'Liability',
        resourceId: liability[0]._id,
        details: {
          description: liability[0].description,
          totalAmount: liability[0].totalAmount,
          creditor: liability[0].creditor,
        },
        ipAddress,
        userAgent,
        statusCode: 201,
      });

      return liability[0];
    } catch (error: any) {
      await session.abortTransaction();
      throw new Error(`Failed to create liability: ${error.message}`);
    } finally {
      session.endSession();
    }
  }

  /**
   * Make a payment towards a liability
   * This creates an expense transaction and updates the liability
   */
  async makePayment(
    userId: string,
    liabilityId: string,
    data: {
      amount: number;
      accountId: string;
      notes?: string;
    },
    ipAddress: string,
    userAgent: string
  ): Promise<{ liability: ILiability; transaction: any }> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Get liability
      const liability = await Liability.findOne({
        _id: liabilityId,
        userId,
      }).session(session);

      if (!liability) {
        throw new Error('Liability not found');
      }

      // Check if liability is already fully paid
      if (liability.status === 'fully_paid') {
        throw new Error('Liability is already fully paid');
      }

      // Validate payment amount
      if (data.amount > liability.remainingAmount) {
        throw new Error(
          `Payment amount (₹${data.amount}) exceeds remaining amount (₹${liability.remainingAmount})`
        );
      }

      // Verify account
      const account = await Account.findOne({
        _id: data.accountId,
        userId,
        isActive: true,
      }).session(session);

      if (!account) {
        throw new Error('Account not found or inactive');
      }

      // Check if account has sufficient balance
      if (account.balance < data.amount) {
        throw new Error(
          `Insufficient balance in account. Available: ₹${account.balance}, Required: ₹${data.amount}`
        );
      }

      // Create expense transaction for the payment
      const transactionData = {
        userId,
        type: TransactionType.EXPENSE,
        expenseCategory: ExpenseCategory.OTHER_EXPENSE,
        amount: data.amount,
        accountId: data.accountId,
        description: `Payment for liability: ${liability.description}`,
        isLiabilityPayment: true,
        liabilityId: liability._id,
        notes: data.notes || `Paid to ${liability.creditor}`,
        date: new Date(),
      };

      const transaction = await this.transactionService.createTransaction(
        userId,
        transactionData,
        ipAddress,
        userAgent
      );

      // Update liability
      liability.paidAmount += data.amount;
      liability.payments.push({
        transactionId: transaction._id,
        amount: data.amount,
        date: new Date(),
        accountId: new mongoose.Types.ObjectId(data.accountId),
        notes: data.notes,
      });

      // Status will be auto-updated in pre-save hook
      await liability.save({ session });

      await session.commitTransaction();

      // 🔥 NEW: Update goals linked to this liability
      try {
        const { Goal } = await import('../models/Goal');
        const goals = await Goal.find({
          userId,
          linkedLiabilityId: liabilityId,
          status: 'active',
        });

        for (const goal of goals) {
          await this.goalService.updateGoalProgress(goal._id.toString());
        }
      } catch (error: any) {
        console.error('Failed to update related goals:', error.message);
      }

      // Audit log
      await AuditLog.log({
        userId: new mongoose.Types.ObjectId(userId),
        action: AuditAction.LIABILITY_PAYMENT,
        resource: 'Liability',
        resourceId: liability._id,
        details: {
          amount: data.amount,
          remainingAmount: liability.remainingAmount,
          status: liability.status,
          transactionId: transaction._id,
        },
        ipAddress,
        userAgent,
        statusCode: 200,
      });

      return { liability, transaction };
    } catch (error: any) {
      await session.abortTransaction();
      throw new Error(`Failed to make payment: ${error.message}`);
    } finally {
      session.endSession();
    }
  }

  /**
   * Get all liabilities for a user
   */
  async getLiabilities(
    userId: string,
    filters: {
      status?: 'active' | 'partially_paid' | 'fully_paid';
      page?: number;
      limit?: number;
    }
  ): Promise<{ liabilities: ILiability[]; total: number; page: number; totalPages: number }> {
    try {
      const query: any = { userId };

      if (filters.status) {
        query.status = filters.status;
      }

      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const skip = (page - 1) * limit;

      const [liabilities, total] = await Promise.all([
        Liability.find(query)
          .sort({ createdDate: -1 })
          .skip(skip)
          .limit(limit)
          .populate('accountId', 'name type'),
        Liability.countDocuments(query),
      ]);

      return {
        liabilities,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error: any) {
      throw new Error(`Failed to fetch liabilities: ${error.message}`);
    }
  }

  /**
   * Get liability by ID
   */
  async getLiabilityById(userId: string, liabilityId: string): Promise<ILiability> {
    try {
      const liability = await Liability.findOne({
        _id: liabilityId,
        userId,
      }).populate('accountId', 'name type');

      if (!liability) {
        throw new Error('Liability not found');
      }

      return liability;
    } catch (error: any) {
      throw new Error(`Failed to fetch liability: ${error.message}`);
    }
  }

  /**
   * Update liability
   */
  async updateLiability(
    userId: string,
    liabilityId: string,
    data: {
      description?: string;
      expectedPaymentDate?: string;
      notes?: string;
      tags?: string[];
    },
    ipAddress: string,
    userAgent: string
  ): Promise<ILiability> {
    try {
      const liability = await Liability.findOne({
        _id: liabilityId,
        userId,
      });

      if (!liability) {
        throw new Error('Liability not found');
      }

      // Update fields
      if (data.description) liability.description = data.description;
      if (data.expectedPaymentDate)
        liability.expectedPaymentDate = new Date(data.expectedPaymentDate);
      if (data.notes !== undefined) liability.notes = data.notes;
      if (data.tags) liability.tags = data.tags;

      await liability.save();

      // Audit log
      await AuditLog.log({
        userId: new mongoose.Types.ObjectId(userId),
        action: AuditAction.LIABILITY_UPDATE,
        resource: 'Liability',
        resourceId: liability._id,
        details: {
          changes: data,
        },
        ipAddress,
        userAgent,
        statusCode: 200,
      });

      return liability;
    } catch (error: any) {
      throw new Error(`Failed to update liability: ${error.message}`);
    }
  }

  /**
   * Delete liability
   */
  async deleteLiability(
    userId: string,
    liabilityId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const liability = await Liability.findOne({
        _id: liabilityId,
        userId,
      }).session(session);

      if (!liability) {
        throw new Error('Liability not found');
      }

      // Don't allow deletion if payments have been made
      if (liability.paidAmount > 0) {
        throw new Error('Cannot delete liability with payment history');
      }

      await Liability.findByIdAndDelete(liabilityId).session(session);

      await session.commitTransaction();

      // Audit log
      await AuditLog.log({
        userId: new mongoose.Types.ObjectId(userId),
        action: AuditAction.LIABILITY_DELETE,
        resource: 'Liability',
        resourceId: liability._id,
        details: {
          description: liability.description,
          totalAmount: liability.totalAmount,
        },
        ipAddress,
        userAgent,
        statusCode: 200,
      });
    } catch (error: any) {
      await session.abortTransaction();
      throw new Error(`Failed to delete liability: ${error.message}`);
    } finally {
      session.endSession();
    }
  }

  /**
   * Get liability summary
   */
  async getLiabilitySummary(userId: string): Promise<{
    total: number;
    paid: number;
    remaining: number;
    activeCount: number;
    fullyPaidCount: number;
  }> {
    try {
      const liabilities = await Liability.find({ userId });

      let total = 0;
      let paid = 0;
      let remaining = 0;
      let activeCount = 0;
      let fullyPaidCount = 0;

      liabilities.forEach((liability) => {
        total += liability.totalAmount;
        paid += liability.paidAmount;
        remaining += liability.remainingAmount;

        if (liability.status === 'active' || liability.status === 'partially_paid') {
          activeCount++;
        }
        if (liability.status === 'fully_paid') {
          fullyPaidCount++;
        }
      });

      return {
        total,
        paid,
        remaining,
        activeCount,
        fullyPaidCount,
      };
    } catch (error: any) {
      throw new Error(`Failed to get liability summary: ${error.message}`);
    }
  }

  /**
   * Get liabilities for settlement period
   */
  async getLiabilitiesForSettlement(
    userId: string,
    settlementPeriod: string
  ): Promise<{
    openingLiabilities: ILiability[];
    newLiabilities: ILiability[];
    paidLiabilities: ILiability[];
    carryForwardLiabilities: ILiability[];
  }> {
    try {
      const allLiabilities = await Liability.find({ userId });

      const openingLiabilities = allLiabilities.filter(
        (l) => l.carriedForwardFrom === settlementPeriod
      );

      const newLiabilities = allLiabilities.filter(
        (l) => l.settlementPeriod === settlementPeriod && !l.carriedForwardFrom
      );

      const paidLiabilities = allLiabilities.filter(
        (l) => l.settlementPeriod === settlementPeriod && l.status === 'fully_paid'
      );

      const carryForwardLiabilities = allLiabilities.filter(
        (l) =>
          l.settlementPeriod === settlementPeriod &&
          (l.status === 'active' || l.status === 'partially_paid')
      );

      return {
        openingLiabilities,
        newLiabilities,
        paidLiabilities,
        carryForwardLiabilities,
      };
    } catch (error: any) {
      throw new Error(`Failed to get liabilities for settlement: ${error.message}`);
    }
  }
  }
