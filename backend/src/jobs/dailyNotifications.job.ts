import { RecurringTransactionService } from '../services/recurringTransaction.service';

export async function runDailyNotifications() {
  try {
    const recurringService = new RecurringTransactionService();
    await recurringService.sendDailyReminders();
    console.log('✅ Daily notifications sent');
  } catch (error: any) {
    console.error('❌ Daily notifications job failed:', error.message);
  }
}
