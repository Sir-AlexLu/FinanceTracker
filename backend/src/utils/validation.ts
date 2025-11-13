import { z } from 'zod';
import { TransactionType, AccountType, BudgetPeriod, RecurringFrequency, SettlementType } from '@/types/common';

// User schemas
export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
});

// Account schemas
export const createAccountSchema = z.object({
  name: z.string().min(1, 'Account name is required'),
  type: z.nativeEnum(AccountType),
  balance: z.number().default(0),
  currency: z.string().default('INR'),
  metadata: z.record(z.any()).optional(),
});

export const updateAccountSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.nativeEnum(AccountType).optional(),
  balance: z.number().optional(),
  currency: z.string().optional(),
  isActive: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
});

// Transaction schemas
export const createTransactionSchema = z.object({
  type: z.nativeEnum(TransactionType),
  amount: z.number().positive('Amount must be positive'),
  description: z.string().min(1, 'Description is required'),
  category: z.string().min(1, 'Category is required'),
  date: z.string().transform(val => new Date(val)),
  accountId: z.string().min(1, 'Account is required'),
  toAccountId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  attachments: z.array(z.string()).optional(),
  isRecurring: z.boolean().default(false),
  recurringTransactionId: z.string().optional(),
});

export const updateTransactionSchema = z.object({
  type: z.nativeEnum(TransactionType).optional(),
  amount: z.number().positive().optional(),
  description: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  date: z.string().transform(val => new Date(val)).optional(),
  accountId: z.string().optional(),
  toAccountId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  attachments: z.array(z.string()).optional(),
});

// Budget schemas
export const createBudgetSchema = z.object({
  name: z.string().min(1, 'Budget name is required'),
  amount: z.number().positive('Amount must be positive'),
  category: z.string().min(1, 'Category is required'),
  period: z.nativeEnum(BudgetPeriod),
  startDate: z.string().transform(val => new Date(val)),
  endDate: z.string().transform(val => new Date(val)),
});

export const updateBudgetSchema = z.object({
  name: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  spent: z.number().min(0).optional(),
  category: z.string().min(1).optional(),
  period: z.nativeEnum(BudgetPeriod).optional(),
  startDate: z.string().transform(val => new Date(val)).optional(),
  endDate: z.string().transform(val => new Date(val)).optional(),
  isActive: z.boolean().optional(),
});

// Goal schemas
export const createGoalSchema = z.object({
  name: z.string().min(1, 'Goal name is required'),
  description: z.string().optional(),
  targetAmount: z.number().positive('Target amount must be positive'),
  currentAmount: z.number().min(0).default(0),
  targetDate: z.string().transform(val => new Date(val)),
  category: z.string().min(1, 'Category is required'),
});

export const updateGoalSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  targetAmount: z.number().positive().optional(),
  currentAmount: z.number().min(0).optional(),
  targetDate: z.string().transform(val => new Date(val)).optional(),
  category: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

// Bill schemas
export const createBillSchema = z.object({
  name: z.string().min(1, 'Bill name is required'),
  amount: z.number().positive('Amount must be positive'),
  dueDate: z.string().transform(val => new Date(val)),
  isPaid: z.boolean().default(false),
  isRecurring: z.boolean().default(false),
  recurringPattern: z.object({
    frequency: z.nativeEnum(RecurringFrequency),
    interval: z.number().positive(),
    endDate: z.string().transform(val => new Date(val)).optional(),
  }).optional(),
  accountId: z.string().min(1, 'Account is required'),
  category: z.string().min(1, 'Category is required'),
});

export const updateBillSchema = z.object({
  name: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  dueDate: z.string().transform(val => new Date(val)).optional(),
  isPaid: z.boolean().optional(),
  isRecurring: z.boolean().optional(),
  recurringPattern: z.object({
    frequency: z.nativeEnum(RecurringFrequency),
    interval: z.number().positive(),
    endDate: z.string().transform(val => new Date(val)).optional(),
  }).optional(),
  accountId: z.string().optional(),
  category: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

// Settlement schemas
export const createSettlementSchema = z.object({
  type: z.nativeEnum(SettlementType),
  period: z.string().min(1, 'Period is required'),
  startDate: z.string().transform(val => new Date(val)),
  endDate: z.string().transform(val => new Date(val)),
  totalIncome: z.number().min(0),
  totalExpense: z.number().min(0),
  isCompleted: z.boolean().default(false),
});

export const updateSettlementSchema = z.object({
  type: z.nativeEnum(SettlementType).optional(),
  period: z.string().min(1).optional(),
  startDate: z.string().transform(val => new Date(val)).optional(),
  endDate: z.string().transform(val => new Date(val)).optional(),
  totalIncome: z.number().min(0).optional(),
  totalExpense: z.number().min(0).optional(),
  isCompleted: z.boolean().optional(),
});

// Query schemas
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export const transactionFilterSchema = z.object({
  type: z.nativeEnum(TransactionType).optional(),
  category: z.string().optional(),
  accountId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
}).merge(paginationSchema);

export const analyticsQuerySchema = z.object({
  period: z.enum(['current', 'last30', 'last90', 'thisYear', 'custom']).default('current'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
