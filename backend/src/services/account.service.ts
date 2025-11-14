import { Account, IAccount } from '../models/Account';
import { Transaction } from '../models/Transaction';
import { AuditLog, AuditAction } from '../models/AuditLog';
import { AccountType } from '../types/models.types';
import { DEFAULT_ACCOUNT_NAMES } from '../config/constants';
import mongoose from 'mongoose';

export class AccountService {
  /**
   * Create a new account
   */
  async createAccount(
    userId: string,
    data: {
      type: AccountType;
      name?: string;
      balance?: number;
      connection?: any;
    },
    ipAddress: string,
    userAgent: string
  ): Promise<IAccount> {
    try {
      const accountData: any = {
        userId,
        type: data.type,
        name: data.name || DEFAULT_ACCOUNT_NAMES[data.type],
        balance: data.balance || 0,
        openingBalance: data.balance || 0,
        connection: data.connection,
        metadata: {
          defaultName: DEFAULT_ACCOUNT_NAMES[data.type],
        },
      };

      const account = await Account.create(accountData);

      // Audit log
      await AuditLog.log({
        userId: new mongoose.Types.ObjectId(userId),
        action: AuditAction.ACCOUNT_CREATE,
        resource: 'Account',
        resourceId: account._id,
        details: {
          type: account.type,
          name: account.name,
          balance: account.balance,
        },
        ipAddress,
        userAgent,
        statusCode: 201,
      });

      return account;
    } catch (error: any) {
      throw new Error(`Failed to create account: ${error.message}`);
    }
  }

  /**
   * Get all accounts for a user
   */
  async getAccounts(userId: string, includeInactive: boolean = false): Promise<IAccount[]> {
    try {
      const query: any = { userId };

      if (!includeInactive) {
        query.isActive = true;
      }

      const accounts = await Account.find(query).sort({ createdAt: -1 });

      return accounts;
    } catch (error: any) {
      throw new Error(`Failed to fetch accounts: ${error.message}`);
    }
  }

  /**
   * Get account by ID
   */
  async getAccountById(userId: string, accountId: string): Promise<IAccount> {
    try {
      const account = await Account.findOne({
        _id: accountId,
        userId,
      });

      if (!account) {
        throw new Error('Account not found');
      }

      return account;
    } catch (error: any) {
      throw new Error(`Failed to fetch account: ${error.message}`);
    }
  }

  /**
   * Update account
   */
  async updateAccount(
    userId: string,
    accountId: string,
    data: {
      name?: string;
      connection?: any;
      isActive?: boolean;
    },
    ipAddress: string,
    userAgent: string
  ): Promise<IAccount> {
    try {
      const account = await Account.findOne({ _id: accountId, userId });

      if (!account) {
        throw new Error('Account not found');
      }

      // Update fields
      if (data.name !== undefined) account.name = data.name;
      if (data.connection !== undefined) account.connection = data.connection;
      if (data.isActive !== undefined) account.isActive = data.isActive;

      await account.save();

      // Audit log
      await AuditLog.log({
        userId: new mongoose.Types.ObjectId(userId),
        action: data.isActive === false ? AuditAction.ACCOUNT_DEACTIVATE : AuditAction.ACCOUNT_UPDATE,
        resource: 'Account',
        resourceId: account._id,
        details: {
          changes: data,
        },
        ipAddress,
        userAgent,
        statusCode: 200,
      });

      return account;
    } catch (error: any) {
      throw new Error(`Failed to update account: ${error.message}`);
    }
  }

  /**
   * Delete account (soft delete)
   */
  async deleteAccount(
    userId: string,
    accountId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    try {
      const account = await Account.findOne({ _id: accountId, userId });

      if (!account) {
        throw new Error('Account not found');
      }

      // Check if account has transactions
      const transactionCount = await Transaction.countDocuments({
        $or: [{ accountId }, { destinationAccountId: accountId }],
      });

      if (transactionCount > 0) {
        // Soft delete - deactivate instead of delete
        account.isActive = false;
        await account.save();

        await AuditLog.log({
          userId: new mongoose.Types.ObjectId(userId),
          action: AuditAction.ACCOUNT_DEACTIVATE,
          resource: 'Account',
          resourceId: account._id,
          details: {
            reason: 'Has transactions',
            transactionCount,
          },
          ipAddress,
          userAgent,
          statusCode: 200,
        });
      } else {
        // Hard delete if no transactions
        await Account.findByIdAndDelete(accountId);

        await AuditLog.log({
          userId: new mongoose.Types.ObjectId(userId),
          action: AuditAction.ACCOUNT_DELETE,
          resource: 'Account',
          resourceId: account._id,
          details: {
            type: account.type,
            name: account.name,
          },
          ipAddress,
          userAgent,
          statusCode: 200,
        });
      }
    } catch (error: any) {
      throw new Error(`Failed to delete account: ${error.message}`);
    }
  }

  /**
   * Get account balance
   */
  async getAccountBalance(userId: string, accountId: string): Promise<number> {
    try {
      const account = await Account.findOne({ _id: accountId, userId });

      if (!account) {
        throw new Error('Account not found');
      }

      return account.balance;
    } catch (error: any) {
      throw new Error(`Failed to get account balance: ${error.message}`);
    }
  }

  /**
   * Update account balance (internal method)
   */
  async updateBalance(accountId: string, amount: number): Promise<void> {
    try {
      const account = await Account.findById(accountId);

      if (!account) {
        throw new Error('Account not found');
      }

      account.balance += amount;
      account.metadata.lastTransactionAt = new Date();

      await account.save();
    } catch (error: any) {
      throw new Error(`Failed to update account balance: ${error.message}`);
    }
  }

  /**
   * Get total balance across all accounts
   */
  async getTotalBalance(userId: string): Promise<number> {
    try {
      const accounts = await Account.find({ userId, isActive: true });

      const total = accounts.reduce((sum, account) => {
        // Exclude loans from total (they're negative)
        if (account.type === AccountType.LOANS) {
          return sum;
        }
        return sum + account.balance;
      }, 0);

      return total;
    } catch (error: any) {
      throw new Error(`Failed to calculate total balance: ${error.message}`);
    }
  }

  /**
   * Get accounts summary
   */
  async getAccountsSummary(userId: string): Promise<{
    total: number;
    byType: Record<AccountType, number>;
    liquidAssets: number;
    investments: number;
    loans: number;
  }> {
    try {
      const accounts = await Account.find({ userId, isActive: true });

      const byType: Record<AccountType, number> = {
        [AccountType.CASH]: 0,
        [AccountType.BANK]: 0,
        [AccountType.SAVINGS]: 0,
        [AccountType.INVESTMENTS]: 0,
        [AccountType.LOANS]: 0,
      };

      let total = 0;
      let liquidAssets = 0;
      let investments = 0;
      let loans = 0;

      accounts.forEach((account) => {
        byType[account.type] += account.balance;

        if (account.type !== AccountType.LOANS) {
          total += account.balance;
        }

        if (
          account.type === AccountType.CASH ||
          account.type === AccountType.BANK ||
          account.type === AccountType.SAVINGS
        ) {
          liquidAssets += account.balance;
        }

        if (account.type === AccountType.INVESTMENTS) {
          investments += account.balance;
        }

        if (account.type === AccountType.LOANS) {
          loans += Math.abs(account.balance);
        }
      });

      return {
        total,
        byType,
        liquidAssets,
        investments,
        loans,
      };
    } catch (error: any) {
      throw new Error(`Failed to get accounts summary: ${error.message}`);
    }
  }
  }
