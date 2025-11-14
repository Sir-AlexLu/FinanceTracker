import { Transaction } from '../models/Transaction';
import { Notification, NotificationType, NotificationPriority } from '../models/Notification';
import { addDays } from '../utils/dateHelpers';

export async function runRecurringTransactionCheck() {
  try {
    const now = new Date();
    const tomorrow = addDays(now, 1);

    // Find recurring transactions due today or tomorrow
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
        actionUrl: `/recurring-transactions/pending`,
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

    console.log(
      `✅ Recurring transaction reminders sent for ${pendingTransactions.length} transactions`
    );
  } catch (error: any) {
    console.error('❌ Recurring transaction check job failed:', error.message);
  }
}
