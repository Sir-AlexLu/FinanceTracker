import { Transaction, ITransaction } from '../models/Transaction';
import { Notification, NotificationType, NotificationPriority } from '../models/Notification';
import { TransactionService } from './transaction.service';
import { addDays } from '../utils/dateHelpers';
import mongoose from 'mongoose';

export interface PendingApproval {
  id: string;
  type: string;
  transactionType: string;
  amount: number;
  description: string;
  frequency: string;
  nextExecution: Date;
  message: string;
  actions: Array<{
    label: string;
    action: string;
    params?: Record<string, any>;
  }>;
}

export class RecurringTransactionService {
  private transactionService: TransactionService;

  constructor() {
    this.transactionService = new TransactionService();
  }

  /**
   * Check for pending recurring transactions that need approval
   */
  async checkPendingRecurringTransactions(userId: string): Promise<PendingApproval[]> {
    try {
      const now = new Date();

      const pendingTransactions = await Transaction.find({
        userId,
        isRecurring: true,
        'recurringConfig.requiresApproval': true,
        'recurringConfig.isApproved': false,
        'recurringConfig.nextExecution': { $lte: now },
      });

      return pendingTransactions.map((transaction) => ({
        id: transaction._id.toString(),
        type: 'recurring_transaction_approval',
        transactionType: transaction.type,
        amount: transaction.amount,
        description: transaction.description,
        frequency: transaction.recurringConfig!.frequency,
        nextExecution: transaction.recurringConfig!.nextExecution!,
        message: `Your recurring ${transaction.type} of ₹${transaction.amount} for "${transaction.description}" is due. Approve to create transaction?`,
        actions: [
          { label: 'Approve', action: 'approve' },
          { label: 'Skip this time', action: 'skip' },
          { label: 'Edit amount', action: 'edit' },
          { label: 'Cancel recurring', action: 'cancel' },
        ],
      }));
    } catch (error: any) {
      throw new Error(
        `Failed to check pending recurring transactions: ${error.message}`
      );
    }
  }

  /**
   * Approve and create recurring transaction
   */
  async approveRecurringTransaction(
    transactionId: string,
    userId: string,
    modifyAmount?: number,
    ipAddress?: string,
    userAgent?: string
  ): Promise<ITransaction> {
    try {
      const recurringTransaction = await Transaction.findOne({
        _id: transactionId,
        userId,
        isRecurring: true,
      });

      if (!recurringTransaction) {
        throw new Error('Recurring transaction not found');
      }

      // Create new transaction based on recurring template
      const newTransactionData: any = {
        type: recurringTransaction.type,
        amount: modifyAmount || recurringTransaction.amount,
        description: recurringTransaction.description,
        accountId: recurringTransaction.accountId.toString(),
        incomeCategory: recurringTransaction.incomeCategory,
        expenseCategory: recurringTransaction.expenseCategory,
        date: new Date().toISOString(),
        notes: `Auto-created from recurring transaction`,
      };

      const newTransaction = await this.transactionService.createTransaction(
        userId,
        newTransactionData,
        ipAddress || 'system',
        userAgent || 'recurring-transaction-service'
      );

      // Update recurring config
      recurringTransaction.recurringConfig!.lastExecuted = new Date();
      recurringTransaction.recurringConfig!.nextExecution = this.calculateNextExecution(
        recurringTransaction.recurringConfig!.frequency,
        recurringTransaction.recurringConfig!.interval
      );
      recurringTransaction.recurringConfig!.isApproved = false; // Reset for next time

      await recurringTransaction.save();

      // Create notification
      await Notification.create({
        userId: new mongoose.Types.ObjectId(userId),
        type: NotificationType.RECURRING_TRANSACTION_APPROVAL,
        title: 'Recurring Transaction Created',
        message: `Your recurring ${recurringTransaction.type} of ₹${newTransaction.amount} has been created successfully`,
        priority: NotificationPriority.LOW,
        isRead: false,
        relatedResourceId: newTransaction._id,
        relatedResourceType: 'Transaction',
      });

      return newTransaction;
    } catch (error: any) {
      throw new Error(`Failed to approve recurring transaction: ${error.message}`);
    }
  }

  /**
   * Skip recurring transaction for this cycle
   */
  async skipRecurringTransaction(transactionId: string, userId: string): Promise<void> {
    try {
      const recurringTransaction = await Transaction.findOne({
        _id: transactionId,
        userId,
        isRecurring: true,
      });

      if (!recurringTransaction) {
        throw new Error('Recurring transaction not found');
      }

      // Update next execution date
      recurringTransaction.recurringConfig!.nextExecution = this.calculateNextExecution(
        recurringTransaction.recurringConfig!.frequency,
        recurringTransaction.recurringConfig!.interval
      );
      recurringTransaction.recurringConfig!.isApproved = false;

      await recurringTransaction.save();
    } catch (error: any) {
      throw new Error(`Failed to skip recurring transaction: ${error.message}`);
    }
  }

  /**
   * Cancel recurring transaction
   */
  async cancelRecurringTransaction(transactionId: string, userId: string): Promise<void> {
    try {
      const recurringTransaction = await Transaction.findOne({
        _id: transactionId,
        userId,
        isRecurring: true,
      });

      if (!recurringTransaction) {
        throw new Error('Recurring transaction not found');
      }

      // Set end date to now to stop future executions
      if (recurringTransaction.recurringConfig) {
        recurringTransaction.recurringConfig.endDate = new Date();
      }

      await recurringTransaction.save();
    } catch (error: any) {
      throw new Error(`Failed to cancel recurring transaction: ${error.message}`);
    }
  }

  /**
   * Calculate next execution date
   */
  private calculateNextExecution(
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly',
    interval: number
  ): Date {
    const now = new Date();
    const next = new Date(now);

    switch (frequency) {
      case 'daily':
        next.setDate(next.getDate() + interval);
        break;
      case 'weekly':
        next.setDate(next.getDate() + interval * 7);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + interval);
        break;
      case 'yearly':
        next.setFullYear(next.getFullYear() + interval);
        break;
    }

    return next;
  }

  /**
   * Get all recurring transactions for a user
   */
  async getRecurringTransactions(userId: string): Promise<ITransaction[]> {
    try {
      return await Transaction.find({
        userId,
        isRecurring: true,
        'recurringConfig.endDate': { $gt: new Date() },
      }).sort({ 'recurringConfig.nextExecution': 1 });
    } catch (error: any) {
      throw new Error(`Failed to get recurring transactions: ${error.message}`);
    }
  }

  /**
   * Send daily reminders for pending approvals
   */
  async sendDailyReminders(): Promise<void> {
    try {
      const now = new Date();
      const tomorrow = addDays(now, 1);

      // Find all pending recurring transactions due today or tomorrow
      const pendingTransactions = await Transaction.find({
        isRecurring: true,
        'recurringConfig.requiresApproval': true,
        'recurringConfig.isApproved': false,
        'recurringConfig.nextExecution': { $gte: now, $lte: tomorrow },
      });

      for (const transaction of pendingTransactions) {
        // Create notification
        await Notification.create({
          userId: transaction.userId,
          type: NotificationType.RECURRING_TRANSACTION_APPROVAL,
          title: 'Recurring Transaction Approval Needed',
          message: `Your recurring ${transaction.type} of ₹${transaction.amount} for "${transaction.description}" needs approval`,
          priority: NotificationPriority.MEDIUM,
          isRead: false,
          actionUrl: `/transactions/recurring/${transaction._id}`,
          actions: [
            {
              label: 'Approve',
              action: 'approve',
              params: { transactionId: transaction._id.toString() },
            },
            {
              label: 'Skip',
              action: 'skip',
              params: { transactionId: transaction._id.toString() },
            },
          ],
          relatedResourceId: transaction._id,
          relatedResourceType: 'Transaction',
          expiresAt: addDays(now, 7),
        });
      }
    } catch (error: any) {
      console.error('Failed to send daily reminders:', error);
    }
  }
}
