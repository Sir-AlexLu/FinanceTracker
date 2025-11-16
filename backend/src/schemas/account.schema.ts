// src/schemas/account.schema.ts
import { z } from 'zod';
import { AccountType, BankConnectionType } from '../types/models.types.js';

const bankConnection = z.object({
  type: z.nativeEnum(BankConnectionType),
  upiAddress: z.string().regex(/^[\w.-]+@[\w.-]+$/).optional(),
  upiName: z.string().min(1).max(100).trim().optional(),
  accountNumber: z.string().min(1).max(20).trim().optional(),
  accountHolderName: z.string().min(1).max(100).trim().optional(),
  ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/).toUpperCase().optional(),
  bankName: z.string().min(1).max(100).trim().optional(),
})
.refine(d => d.type !== BankConnectionType.UPI || !!(d.upiAddress && d.upiName), { message: 'UPI needs address & name' })
.refine(d => d.type !== BankConnectionType.BANK_DETAILS || !!(d.accountNumber && d.accountHolderName && d.ifscCode && d.bankName), { message: 'Bank details required' });

export const createAccountSchema = z.object({
  type: z.nativeEnum(AccountType),
  name: z.string().min(1).max(50).trim().optional(),
  balance: z.number().min(0).default(0),
  connection: bankConnection.optional(),
})
.refine(d => ![AccountType.BANK, AccountType.SAVINGS].includes(d.type) || !!d.connection, { message: 'Bank/Savings need connection' });

export const updateAccountSchema = z.object({
  name: z.string().min(1).max(50).trim().optional(),
  connection: bankConnection.optional(),
  isActive: z.boolean().optional(),
});

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
