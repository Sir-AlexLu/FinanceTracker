import Account from '@/models/Account';
import { IAccount } from '@/types/database';
import { ApiResponse, PaginatedResponse } from '@/types/common';

export class AccountsService {
  async getAccounts(userId: string): Promise<ApiResponse<{ accounts: IAccount[], summary: any }>> {
    try {
      const accounts = await Account.find({ userId, isActive: true })
        .sort({ name: 1 });

      // Calculate summary
      const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
      const pendingLiabilities = accounts
        .filter(account => account.type === 'loan')
        .reduce((sum, account) => sum + Math.abs(account.balance), 0);
      const netWorth = totalBalance - pendingLiabilities;

      return {
        success: true,
        data: {
          accounts,
          summary: {
            totalBalance,
            pendingLiabilities,
            netWorth,
          },
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch accounts',
      };
    }
  }

  async getAccountById(userId: string, accountId: string): Promise<ApiResponse<IAccount>> {
    try {
      const account = await Account.findOne({
        _id: accountId,
        userId,
        isActive: true,
      });

      if (!account) {
        return {
          success: false,
          message: 'Account not found',
        };
      }

      return {
        success: true,
        data: account,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch account',
      };
    }
  }

  async createAccount(userId: string, accountData: any): Promise<ApiResponse<IAccount>> {
    try {
      const account = new Account({
        ...accountData,
        userId,
      });

      await account.save();

      return {
        success: true,
        data: account,
        message: 'Account created successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to create account',
      };
    }
  }

  async updateAccount(
    userId: string, 
    accountId: string, 
    accountData: any
  ): Promise<ApiResponse<IAccount>> {
    try {
      const account = await Account.findOneAndUpdate(
        { _id: accountId, userId },
        accountData,
        { new: true, runValidators: true }
      );

      if (!account) {
        return {
          success: false,
          message: 'Account not found',
        };
      }

      return {
        success: true,
        data: account,
        message: 'Account updated successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to update account',
      };
    }
  }

  async deleteAccount(userId: string, accountId: string): Promise<ApiResponse<null>> {
    try {
      const account = await Account.findOneAndUpdate(
        { _id: accountId, userId },
        { isActive: false },
        { new: true }
      );

      if (!account) {
        return {
          success: false,
          message: 'Account not found',
        };
      }

      return {
        success: true,
        message: 'Account deleted successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to delete account',
      };
    }
  }
}

export const accountsService = new AccountsService();
