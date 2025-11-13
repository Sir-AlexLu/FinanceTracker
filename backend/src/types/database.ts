import { Document } from 'mongoose';
import { TransactionType, AccountType, BudgetPeriod, RecurringFrequency, SettlementType } from './common';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  isActive: boolean;
  lastLogin?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IAccount extends Document {
  userId: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  isActive: boolean;
  metadata?: Record<string, any>;
}

export interface ITransaction extends Document {
  userId: string;
  type: TransactionType;
  amount: number;
  description: string;
  category: string;
  date: Date;
  accountId: string;
  toAccountId?: string;
  tags?: string[];
  notes?: string;
  attachments?: string[];
  isRecurring: boolean;
  recurringTransactionId?: string;
}

export interface IBudget extends Document {
  userId: string;
  name: string;
  amount: number;
  spent: number;
  category: string;
  period: BudgetPeriod;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}

export interface IGoal extends Document {
  userId: string;
  name: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: Date;
  category: string;
  isActive: boolean;
}

export interface IBill extends Document {
  userId: string;
  name: string;
  amount: number;
  dueDate: Date;
  isPaid: boolean;
  isRecurring: boolean;
  recurringPattern?: {
    frequency: RecurringFrequency;
    interval: number;
    endDate?: Date;
  };
  accountId: string;
  category: string;
  isActive: boolean;
}

export interface ISettlement extends Document {
  userId: string;
  type: SettlementType;
  period: string;
  startDate: Date;
  endDate: Date;
  totalIncome: number;
  totalExpense: number;
  netAmount: number;
  isCompleted: boolean;
}
