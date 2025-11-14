import { Bill, IBill } from '../models/Bill';
import { Account } from '../models/Account';
import { Notification, NotificationType, NotificationPriority } from '../models/Notification';
import { AuditLog, AuditAction } from '../models/AuditLog';
import { TransactionService } from './transaction.service';
import { TransactionType, ExpenseCategory } from '../types/models.types';
import { addDays } from '../utils/dateHelpers';
import mongoose from 'mongoose';

export class BillService {
  private transactionService: TransactionService;

  constructor() {
    this.transactionService = new TransactionService();
  }

  /**
   * Create a new bill
   */
  async createBill(
    userId: string,
    data: {
      name: string;
      amount: number;
      category: ExpenseCategory;
      dueDate: string;
      isRecurring?: boolean;
      recurringPattern?: any;
      defaultAccountId?: string;
      reminderDays?: number[];
      notes?: string;
    },
    ipAddress: string,
    userAgent: string
  ): Promise<IBill> {
    try {
      // Verify default account if provided
      if (data.defaultAccountId) {
        const account = await Account.findOne({
          _id: data.defaultAccountId,
          userId,
          isActive: true,
        });

        if (!account) {
          throw new Error('Default account not found or inactive');
        }
      }

      const billData = {
        userId,
        name: data.name,
        amount: data.amount,
        category: data.category,
        dueDate: new Date(data.dueDate),
        isRecurring: data.isRecurring || false,
        recurringPattern: data.recurringPattern,
        status: 'upcoming',
        paidAmount: 0,
        paymentHistory: [],
        defaultAccountId: data.defaultAccountId,
        reminderDays: data.reminderDays || [3, 1],
        notes: data.notes,
      };

      const bill = await Bill.create(billData);

      // Schedule reminders
      await this.scheduleReminders(bill);

      // Audit log
      await AuditLog.log({
        userId: new mongoose.Types.ObjectId(userId),
        action: AuditAction.BILL_CREATE,
        resource: 'Bill',
        resourceId: bill._id,
        details: {
          name: bill.name,
          amount: bill.amount,
          dueDate: bill.dueDate,
        },
        ipAddress,
        userAgent,
        statusCode: 201,
      });

      return bill;
    } catch (error: any) {
      throw new Error(`Failed to create bill: ${error.message}`);
    }
  }

  /**
   * Schedule bill reminders
   */
  private async scheduleReminders(bill: IBill): Promise<void> {
    try {
      const now = new Date();

      for (const days of bill.reminderDays) {
        const reminderDate = new Date(bill.dueDate);
        reminderDate.setDate(reminderDate.getDate() - days);

        // Only create reminder if it's in the future
        if (reminderDate > now) {
          await Notification.create({
            userId: bill.userId,
            type: NotificationType.BILL_DUE,
            title: `Bill Reminder: ${bill.name}`,
            message: `Your ${bill.name} of ₹${bill.amount} is due in ${days} day${
              days !== 1 ? 's' : ''
            } (${bill.dueDate.toLocaleDateString()})`,
            priority: days === 1 ? NotificationPriority.HIGH : NotificationPriority.MEDIUM,
            isRead: false,
            actionUrl: `/bills/${bill._id}`,
            actions: [
              {
                label: 'Mark as Paid',
                action: 'mark_paid',
                params: { billId: bill._id.toString() },
              },
              {
                label: 'View Details',
                action: 'view',
                url: `/bills/${bill._id}`,
              },
            ],
            relatedResourceId: bill._id,
            relatedResourceType: 'Bill',
            expiresAt: addDays(bill.dueDate, 7),
          });
        }
      }
    } catch (error: any) {
      console.error('Failed to schedule bill reminders:', error);
    }
  }

  /**
   * Get bill payment approval notification
   */
  async getBillPaymentApproval(
    userId: string,
    billId: string
  ): Promise<{
    id: string;
    type: string;
    billId: string;
    dueDate: Date;
    amount: number;
    name: string;
    message: string;
    actions: any[];
  }> {
    try {
      const bill = await Bill.findOne({ _id: billId, userId });

      if (!bill) {
        throw new Error('Bill not found');
      }

      return {
        id: crypto.randomUUID(),
        type: 'bill_payment_approval',
        billId: bill._id.toString(),
        dueDate: bill.dueDate,
        amount: bill.amount,
        name: bill.name,
        message: `Your ${bill.name} of ₹${bill.amount} is due on ${bill.dueDate.toLocaleDateString()}. Would you like to mark it as paid?`,
        actions: [
          {
            label: 'Yes, I paid it',
            action: 'approve',
            requiresAccount: true,
          },
          {
            label: 'Remind me tomorrow',
            action: 'snooze',
          },
          {
            label: 'Not yet',
            action: 'dismiss',
          },
        ],
      };
    } catch (error: any) {
      throw new Error(`Failed to get bill payment approval: ${error.message}`);
    }
  }

  /**
   * Mark bill as paid
   */
  async markAsPaid(
    userId: string,
    billId: string,
    data: {
      accountId: string;
      amount?: number;
      notes?: string;
    },
    ipAddress: string,
    userAgent: string
  ): Promise<{ bill: IBill; transaction: any }> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const bill = await Bill.findOne({ _id: billId, userId }).session(session);

      if (!bill) {
        throw new Error('Bill not found');
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

      const paymentAmount = data.amount || bill.amount - bill.paidAmount;

      // Check if account has sufficient balance
      if (account.balance < paymentAmount) {
        throw new Error(
          `Insufficient balance in account. Available: ₹${account.balance}, Required: ₹${paymentAmount}`
        );
      }

      // Create expense transaction
      const transactionData = {
        userId,
        type: TransactionType.EXPENSE,
        expenseCategory: bill.category,
        amount: paymentAmount,
        accountId: data.accountId,
        description: `Bill payment: ${bill.name}`,
        notes: data.notes || `Paid ${bill.name}`,
        date: new Date(),
      };

      const transaction = await this.transactionService.createTransaction(
        userId,
        transactionData,
        ipAddress,
        userAgent
      );

      // Update bill
      bill.paidAmount += paymentAmount;
      bill.paymentHistory.push({
        transactionId: transaction._id,
        amount: paymentAmount,
        date: new Date(),
        accountId: new mongoose.Types.ObjectId(data.accountId),
        notes: data.notes,
      });

      // Status will be auto-updated in pre-save hook
      await bill.save({ session });

      // If recurring, create next bill
      if (bill.isRecurring && bill.recurringPattern && bill.status === 'paid') {
        await this.createNextRecurringBill(bill, session);
      }

      await session.commitTransaction();

      // Audit log
      await AuditLog.log({
        userId: new mongoose.Types.ObjectId(userId),
        action: AuditAction.BILL_PAYMENT,
        resource: 'Bill',
        resourceId: bill._id,
        details: {
          amount: paymentAmount,
          status: bill.status,
          transactionId: transaction._id,
        },
        ipAddress,
        userAgent,
        statusCode: 200,
      });

      return { bill, transaction };
    } catch (error: any) {
      await session.abortTransaction();
      throw new Error(`Failed to mark bill as paid: ${error.message}`);
    } finally {
      session.endSession();
    }
  }

  /**
   * Create next recurring bill
   */
  private async createNextRecurringBill(bill: IBill, session?: any): Promise<IBill | null> {
    try {
      if (!bill.isRecurring || !bill.recurringPattern) {
        return null;
      }

      const { frequency, interval, endDate } = bill.recurringPattern;

      // Calculate next due date
      let nextDueDate = new Date(bill.dueDate);

      switch (frequency) {
        case 'daily':
          nextDueDate.setDate(nextDueDate.getDate() + interval);
          break;
        case 'weekly':
          nextDueDate.setDate(nextDueDate.getDate() + interval * 7);
          break;
        case 'monthly':
          nextDueDate.setMonth(nextDueDate.getMonth() + interval);
          break;
        case 'yearly':
          nextDueDate.setFullYear(nextDueDate.getFullYear() + interval);
          break;
      }

      // Check if we've reached the end date
      if (endDate && nextDueDate > new Date(endDate)) {
        return null;
      }

      // Create next bill
      const nextBillData = {
        userId: bill.userId,
        name: bill.name,
        amount: bill.amount,
        category: bill.category,
        dueDate: nextDueDate,
        isRecurring: true,
        recurringPattern: bill.recurringPattern,
        status: 'upcoming',
        paidAmount: 0,
        paymentHistory: [],
        defaultAccountId: bill.defaultAccountId,
        reminderDays: bill.reminderDays,
        notes: bill.notes,
      };

      const nextBill = await Bill.create([nextBillData], { session });

      // Schedule reminders for next bill
      await this.scheduleReminders(nextBill[0]);

      return nextBill[0];
    } catch (error: any) {
      console.error('Failed to create next recurring bill:', error);
      return null;
    }
  }

  /**
   * Get bills with filters
   */
  async getBills(
    userId: string,
    filters: {
      status?: 'upcoming' | 'overdue' | 'paid' | 'partially_paid';
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{ bills: IBill[]; total: number; page: number; totalPages: number }> {
    try {
      const query: any = { userId };

      if (filters.status) {
        query.status = filters.status;
      }

      if (filters.startDate || filters.endDate) {
        query.dueDate = {};
        if (filters.startDate) query.dueDate.$gte = new Date(filters.startDate);
        if (filters.endDate) query.dueDate.$lte = new Date(filters.endDate);
      }

      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const skip = (page - 1) * limit;

      const [bills, total] = await Promise.all([
        Bill.find(query)
          .sort({ dueDate: 1 })
          .skip(skip)
          .limit(limit)
          .populate('defaultAccountId', 'name type'),
        Bill.countDocuments(query),
      ]);

      return {
        bills,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error: any) {
      throw new Error(`Failed to fetch bills: ${error.message}`);
    }
  }

  /**
   * Get upcoming bills (due in next 7 days)
   */
  async getUpcomingBills(userId: string): Promise<IBill[]> {
    try {
      const today = new Date();
      const nextWeek = addDays(today, 7);

      const bills = await Bill.find({
        userId,
        status: { $in: ['upcoming', 'overdue', 'partially_paid'] },
        dueDate: { $lte: nextWeek },
      })
        .sort({ dueDate: 1 })
        .populate('defaultAccountId', 'name type');

      return bills;
    } catch (error: any) {
      throw new Error(`Failed to fetch upcoming bills: ${error.message}`);
    }
  }

  /**
   * Get bill by ID
   */
  async getBillById(userId: string, billId: string): Promise<IBill> {
    try {
      const bill = await Bill.findOne({ _id: billId, userId }).populate(
        'defaultAccountId',
        'name type'
      );

      if (!bill) {
        throw new Error('Bill not found');
      }

      return bill;
    } catch (error: any) {
      throw new Error(`Failed to fetch bill: ${error.message}`);
    }
  }

  /**
   * Update bill
   */
  async updateBill(
    userId: string,
    billId: string,
    data: {
      name?: string;
      amount?: number;
      category?: ExpenseCategory;
      dueDate?: string;
      defaultAccountId?: string;
      reminderDays?: number[];
      notes?: string;
    },
    ipAddress: string,
    userAgent: string
  ): Promise<IBill> {
    try {
      const bill = await Bill.findOne({ _id: billId, userId });

      if (!bill) {
        throw new Error('Bill not found');
      }

      // Don't allow editing if already paid
      if (bill.status === 'paid') {
        throw new Error('Cannot edit a paid bill');
      }

      // Update fields
      if (data.name) bill.name = data.name;
      if (data.amount) bill.amount = data.amount;
      if (data.category) bill.category = data.category;
      if (data.dueDate) bill.dueDate = new Date(data.dueDate);
      if (data.defaultAccountId) bill.defaultAccountId = new mongoose.Types.ObjectId(data.defaultAccountId);
      if (data.reminderDays) bill.reminderDays = data.reminderDays;
      if (data.notes !== undefined) bill.notes = data.notes;

      await bill.save();

      // Audit log
      await AuditLog.log({
        userId: new mongoose.Types.ObjectId(userId),
        action: AuditAction.BILL_UPDATE,
        resource: 'Bill',
        resourceId: bill._id,
        details: { changes: data },
        ipAddress,
        userAgent,
        statusCode: 200,
      });

      return bill;
    } catch (error: any) {
      throw new Error(`Failed to update bill: ${error.message}`);
    }
  }

  /**
   * Delete bill
   */
  async deleteBill(
    userId: string,
    billId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    try {
      const bill = await Bill.findOne({ _id: billId, userId });

      if (!bill) {
        throw new Error('Bill not found');
      }

      // Don't allow deletion if payments have been made
      if (bill.paymentHistory.length > 0) {
        throw new Error('Cannot delete bill with payment history');
      }

      await Bill.findByIdAndDelete(billId);

      // Audit log
      await AuditLog.log({
        userId: new mongoose.Types.ObjectId(userId),
        action: AuditAction.BILL_DELETE,
        resource: 'Bill',
        resourceId: bill._id,
        details: {
          name: bill.name,
          amount: bill.amount,
        },
        ipAddress,
        userAgent,
        statusCode: 200,
      });
    } catch (error: any) {
      throw new Error(`Failed to delete bill: ${error.message}`);
    }
  }
      }
