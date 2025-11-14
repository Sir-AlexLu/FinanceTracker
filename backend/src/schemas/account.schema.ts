import { z } from 'zod';
import { objectIdSchema } from '../utils/validation';
import { AccountType, BankConnectionType } from '../types/models.types';

// Bank connection schema
const bankConnectionSchema = z
  .object({
    type: z.nativeEnum(BankConnectionType),
    // UPI fields
    upiAddress: z.string().regex(/^[\w.-]+@[\w.-]+$/, 'Invalid UPI address format').optional(),
    upiName: z.string().min(1).max(100).trim().optional(),
    // Bank details fields
    accountNumber: z.string().min(1).max(20).trim().optional(),
    accountHolderName: z.string().min(1).max(100).trim().optional(),
    ifscCode: z
      .string()
      .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code format')
      .toUpperCase()
      .optional(),
    bankName: z.string().min(1).max(100).trim().optional(),
  })
  .refine(
    (data) => {
      if (data.type === BankConnectionType.UPI) {
        return !!(data.upiAddress && data.upiName);
      }
      return true;
    },
    {
      message: 'UPI address and name are required for UPI connection',
    }
  )
  .refine(
    (data) => {
      if (data.type === BankConnectionType.BANK_DETAILS) {
        return !!(
          data.accountNumber &&
          data.accountHolderName &&
          data.ifscCode &&
          data.bankName
        );
      }
      return true;
    },
    {
      message: 'All bank details are required for bank connection',
    }
  );

// Create account schema
export const createAccountSchema = z
  .object({
    type: z.nativeEnum(AccountType),
    name: z.string().min(1).max(50).trim().optional(),
    balance: z.number().min(0, 'Initial balance cannot be negative').default(0),
    connection: bankConnectionSchema.optional(),
  })
  .refine(
    (data) => {
      if (data.type === AccountType.BANK || data.type === AccountType.SAVINGS) {
        return !!data.connection;
      }
      return true;
    },
    {
      message: 'Bank and Savings accounts must have connection details',
    }
  );

export type CreateAccountInput = z.infer<typeof createAccountSchema>;

// Update account schema
export const updateAccountSchema = z.object({
  name: z.string().min(1).max(50).trim().optional(),
  connection: bankConnectionSchema.optional(),
  isActive: z.boolean().optional(),
});

export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;

// Get account by ID schema
export const getAccountByIdSchema = z.object({
  accountId: objectIdSchema,
});

export type GetAccountByIdInput = z.infer<typeof getAccountByIdSchema>;
