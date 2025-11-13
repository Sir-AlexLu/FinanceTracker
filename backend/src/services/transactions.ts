import Transaction from '@/models/Transaction';
import Account from '@/models/Account';
import { ITransaction } from '@/types/database';
import { ApiResponse, PaginatedResponse, TransactionType } from '@/types/common';

export class TransactionsService {
  async getTransactions(
    userId: string, 
    filters: any
  ): Promise<ApiResponse<PaginatedResponse<ITransaction>>> {
    try {
      // Build filter
      const filter: any = { userId };
      
      if (filters.type) filter.type = filters.type;
      if (filters.category) filter.category = filters.category;
      if (filters.accountId) filter.accountId = filters.accountId;
      
      if (filters.startDate || filters.endDate) {
        filter.date = {};
        if (filters.startDate) filter.date.$gte = new Date(filters.startDate);
        if (filters.endDate) filter.date.$lte = new Date(filters.endDate);
      }

      // Get transactions with pagination
      const skip = (filters.page - 1) * filters.limit;
      const transactions = await Transaction.find(filter)
        .populate('accountId', 'name type')
        .populate('toAccountId', 'name type')
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(filters.limit);

      // Get total count for pagination
      const total = await Transaction.countDocuments(filter);

      return {
        success: true,
        data: {
          data: transactions,
          pagination: {
            page: filters.page,
            limit: filters.limit,
            total,
            totalPages: Math.ceil(total / filters.limit),
          },
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch transactions',
      };
    }
  }

  async getRecentTransactions(userId: string, limit = 5): Promise<ApiResponse<ITransaction[]>> {
    try {
      const transactions = await Transaction.find({ userId })
        .populate('accountId', 'name type')
        .populate('toAccountId', 'name type')
        .sort({ date: -1, createdAt: -1 })
        .limit(limit);

      return {
        success: true,
        data: transactions,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch recent transactions',
      };
    }
  }

  async getTransactionById(
    userId: string, 
    transactionId: string
  ): Promise<ApiResponse<ITransaction>> {
    try {
      const transaction = await Transaction.findOne({
        _id: transactionId,
        userId,
      })
        .populate('accountId', 'name type')
        .populate('toAccountId', 'name type');

      if (!transaction) {
        return {
          success: false,
          message: 'Transaction not found',
        };
      }

      return {
        success: true,
        data: transaction,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch transaction',
      };
    }
  }

  async createTransaction(userId: string, transactionData: any): Promise<ApiResponse<ITransaction>> {
    try {
      // Validate accounts
      const account = await Account.findOne({
        _id: transactionData.accountId,
        userId,
        isActive: true,
      });

      if (!account) {
        return {
          success: false,
          message: 'Invalid account',
        };
      }

      // For transfers, validate the destination account
      if (transactionData.type === TransactionType.TRANSFER) {
        if (!transactionData.toAccountId) {
          return {
            success: false,
            message: 'Destination account is required for transfers',
          };
        }

        const toAccount = await Account.findOne({
          _id: transactionData.toAccountId,
          userId,
          isActive: true,
        });

        if (!toAccount) {
          return {
            success: false,
            message: 'Invalid destination account',
          };
        }

        if (transactionData.accountId === transactionData.toAccountId) {
          return {
            success: false,
            message: 'Source and destination accounts cannot be the same',
          };
        }
      }

      // Create transaction
      const transaction = new Transaction({
        ...transactionData,
        userId,
      });

      await transaction.save();

      // Update account balances
      await this.updateAccountBalances(transaction);

      // Populate account details for response
      await transaction.populate('accountId', 'name type');
      if (transaction.toAccountId) {
        await transaction.populate('toAccountId', 'name type');
      }

      return {
        success: true,
        data: transaction,
        message: 'Transaction created successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to create transaction',
      };
    }
  }

  async updateTransaction(
    userId: string, 
    transactionId: string, 
    transactionData: any
  ): Promise<ApiResponse<ITransaction>> {
    try {
      // Get original transaction
      const originalTransaction = await Transaction.findOne({
        _id: transactionId,
        userId,
      });

      if (!originalTransaction) {
        return {
          success: false,
          message: 'Transaction not found',
        };
      }

      // If changing accounts, validate them
      if (transactionData.accountId) {
        const account = await Account.findOne({
          _id: transactionData.accountId,
          userId,
          isActive: true,
        });

        if (!account) {
          return {
            success: false,
            message: 'Invalid account',
          };
        }
      }

      // For transfers, validate the destination account
      if (
        (transactionData.type === TransactionType.TRANSFER || 
        originalTransaction.type === TransactionType.TRANSFER) &&
        transactionData.toAccountId !== undefined
      ) {
        if (transactionData.toAccountId) {
          const toAccount = await Account.findOne({
            _id: transactionData.toAccountId,
            userId,
            isActive: true,
          });

          if (!toAccount) {
            return {
              success: false,
              message: 'Invalid destination account',
            };
          }

          const accountId = transactionData.accountId || originalTransaction.accountId;
          if (accountId === transactionData.toAccountId) {
            return {
              success: false,
              message: 'Source and destination accounts cannot be the same',
            };
          }
        }
      }

      // Revert original transaction's effect on balances
      await this.revertTransactionEffect(originalTransaction);

      // Update transaction
      const updatedTransaction = await Transaction.findOneAndUpdate(
        { _id: transactionId, userId },
        transactionData,
        { new: true, runValidators: true }
      );

      if (!updatedTransaction) {
        return {
          success: false,
          message: 'Transaction not found',
        };
      }

      // Apply updated transaction's effect on balances
      await this.updateAccountBalances(updatedTransaction);

      // Populate account details for response
      await updatedTransaction.populate('accountId', 'name type');
      if (updatedTransaction.toAccountId) {
        await updatedTransaction.populate('toAccountId', 'name type');
      }

      return {
        success: true,
        data: updatedTransaction,
        message: 'Transaction updated successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to update transaction',
      };
    }
  }

  async deleteTransaction(userId: string, transactionId: string): Promise<ApiResponse<null>> {
    try {
      const transaction = await Transaction.findOne({
        _id: transactionId,
        userId,
      });

      if (!transaction) {
        return {
          success: false,
          message: 'Transaction not found',
        };
      }

      // Revert transaction's effect on balances
      await this.revertTransactionEffect(transaction);

      // Delete transaction
      await Transaction.deleteOne({ _id: transactionId });

      return {
        success: true,
        message: 'Transaction deleted successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to delete transaction',
      };
    }
  }

  // Helper function to update account balances based on transaction
  private async updateAccountBalances(transaction: ITransaction) {
    switch (transaction.type) {
      case TransactionType.INCOME:
        await Account.findByIdAndUpdate(
          transaction.accountId,
          { $inc: { balance: transaction.amount } }
        );
        break;
      case TransactionType.EXPENSE:
      case TransactionType.LIABILITY:
        await Account.findByIdAndUpdate(
          transaction.accountId,
          { $inc: { balance: -transaction.amount } }
        );
        break;
      case TransactionType.TRANSFER:
        await Account.findByIdAndUpdate(
          transaction.accountId,
          { $inc: { balance: -transaction.amount } }
        );
        await Account.findByIdAndUpdate(
          transaction.toAccountId,
          { $inc: { balance: transaction.amount } }
        );
        break;
    }
  }

  // Helper function to revert transaction's effect on account balances
  private async revertTransactionEffect(transaction: ITransaction) {
    switch (transaction.type) {
      case TransactionType.INCOME:
        await Account.findByIdAndUpdate(
          transaction.accountId,
          { $inc: { balance: -transaction.amount } }
        );
        break;
      case TransactionType.EXPENSE:
      case TransactionType.LIABILITY:
        await Account.findByIdAndUpdate(
          transaction.accountId,
          { $inc: { balance: transaction.amount } }
        );
        break;
      case TransactionType.TRANSFER:
        await Account.findByIdAndUpdate(
          transaction.accountId,
          { $inc: { balance: transaction.amount } }
        );
        await Account.findByIdAndUpdate(
          transaction.toAccountId,
          { $inc: { balance: -transaction.amount } }
        );
        break;
    }
  }
}

export const transactionsService = new TransactionsService();
