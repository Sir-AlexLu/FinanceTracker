import { Bill } from '../models/Bill';
import { Notification, NotificationType, NotificationPriority } from '../models/Notification';
import { addDays } from '../utils/dateHelpers';

export async function runBillReminders() {
  try {
    const today = new Date();
    const tomorrow = addDays(today, 1);

    // Find bills due today or tomorrow
    const upcomingBills = await Bill.find({
      status: { $in: ['upcoming', 'partially_paid'] },
      dueDate: { $gte: today, $lte: tomorrow },
    });

    for (const bill of upcomingBills) {
      const daysUntilDue = Math.ceil(
        (bill.dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      await Notification.create({
        userId: bill.userId,
        type: NotificationType.BILL_DUE,
        title: `Bill Due: ${bill.name}`,
        message: `Your ${bill.name} of ₹${bill.amount} is due ${
          daysUntilDue === 0 ? 'today' : 'tomorrow'
        }`,
        priority: daysUntilDue === 0 ? NotificationPriority.HIGH : NotificationPriority.MEDIUM,
        isRead: false,
        actionUrl: `/bills/${bill._id}`,
        relatedResourceId: bill._id,
        relatedResourceType: 'Bill',
      });
    }

    console.log(`✅ Bill reminders sent for ${upcomingBills.length} bills`);
  } catch (error: any) {
    console.error('❌ Bill reminders job failed:', error.message);
  }
}
