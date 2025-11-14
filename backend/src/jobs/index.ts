import cron from 'node-cron';
import { getEnv } from '../config/env';
import { CRON_SCHEDULES } from '../config/constants';

// Import job functions
import { runDailyNotifications } from './dailyNotifications.job';
import { runBillReminders } from './billReminders.job';
import { runRecurringTransactionCheck } from './recurringTransactionCheck.job';

export function startCronJobs() {
  const env = getEnv();

  if (!env.ENABLE_CRON_JOBS) {
    console.log('⏰ Cron jobs disabled');
    return;
  }

  console.log('⏰ Starting cron jobs...');

  // Daily notifications at 9 AM
  cron.schedule(CRON_SCHEDULES.DAILY_NOTIFICATIONS, async () => {
    console.log('Running daily notifications job...');
    await runDailyNotifications();
  });

  // Bill reminders at 8 AM
  cron.schedule(CRON_SCHEDULES.BILL_REMINDERS, async () => {
    console.log('Running bill reminders job...');
    await runBillReminders();
  });

  // Check recurring transactions at 9 AM
  cron.schedule(CRON_SCHEDULES.DAILY_NOTIFICATIONS, async () => {
    console.log('Running recurring transaction check...');
    await runRecurringTransactionCheck();
  });

  console.log('✅ Cron jobs started');
}
