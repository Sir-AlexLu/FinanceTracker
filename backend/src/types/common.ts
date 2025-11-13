export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
  TRANSFER = 'transfer',
  LIABILITY = 'liability',
}

export enum AccountType {
  CASH = 'cash',
  BANK = 'bank',
  CREDIT_CARD = 'credit_card',
  INVESTMENT = 'investment',
  LOAN = 'loan',
}

export enum BudgetPeriod {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

export enum RecurringFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

export enum SettlementType {
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

export interface AnalyticsData {
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  savingsRate: number;
  expensesByCategory: CategoryData[];
  incomeByCategory: CategoryData[];
  monthlyTrend: MonthlyData[];
  cashFlow: CashFlowData[];
}

export interface CategoryData {
  category: string;
  amount: number;
  percentage: number;
}

export interface MonthlyData {
  month: string;
  income: number;
  expense: number;
  savings: number;
}

export interface CashFlowData {
  date: string;
  inflow: number;
  outflow: number;
  netFlow: number;
}
