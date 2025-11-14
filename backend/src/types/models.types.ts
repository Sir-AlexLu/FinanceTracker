import { Types } from 'mongoose';

export enum AccountType {
  CASH = 'cash',
  BANK = 'bank',
  SAVINGS = 'savings',
  INVESTMENTS = 'investments',
  LOANS = 'loans',
}

export enum BankConnectionType {
  UPI = 'upi',
  BANK_DETAILS = 'bank_details',
}

export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
  TRANSFER = 'transfer',
  LIABILITY = 'liability',
}

export enum IncomeCategory {
  SALARY = 'salary',
  BUSINESS = 'business',
  ALLOWANCE = 'allowance',
  OTHER_INCOME = 'other_income',
}

export enum ExpenseCategory {
  GROCERIES = 'groceries',
  FOOD_DINING = 'food_dining',
  TRANSPORTATION = 'transportation',
  HEALTH = 'health',
  EDUCATION = 'education',
  OTHER_EXPENSE = 'other_expense',
}

export interface JWTPayload {
  userId: string;
  email: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}
