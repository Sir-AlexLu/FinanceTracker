import Budget from '@/models/Budget';
import { IBudget } from '@/types/database';
import { ApiResponse } from '@/types/common';

export class BudgetsService {
  async getBudgets(userId: string): Promise<ApiResponse<IBudget[]>> {
    try {
      const budgets = await Budget.find({ userId, isActive: true })
        .sort({ name: 1 });

      return {
        success: true,
        data: budgets,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch budgets',
      };
    }
  }

  async getBudgetById(userId: string, budgetId: string): Promise<ApiResponse<IBudget>> {
    try {
      const budget = await Budget.findOne({
        _id: budgetId,
        userId,
        isActive: true,
      });

      if (!budget) {
        return {
          success: false,
          message: 'Budget not found',
        };
      }

      return {
        success: true,
        data: budget,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch budget',
      };
    }
  }

  async createBudget(userId: string, budgetData: any): Promise<ApiResponse<IBudget>> {
    try {
      const budget = new Budget({
        ...budgetData,
        userId,
        spent: 0, // Initially spent is 0
      });

      await budget.save();

      return {
        success: true,
        data: budget,
        message: 'Budget created successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to create budget',
      };
    }
  }

  async updateBudget(
    userId: string, 
    budgetId: string, 
    budgetData: any
  ): Promise<ApiResponse<IBudget>> {
    try {
      const budget = await Budget.findOneAndUpdate(
        { _id: budgetId, userId },
        budgetData,
        { new: true, runValidators: true }
      );

      if (!budget) {
        return {
          success: false,
          message: 'Budget not found',
        };
      }

      return {
        success: true,
        data: budget,
        message: 'Budget updated successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to update budget',
      };
    }
  }

  async deleteBudget(userId: string, budgetId: string): Promise<ApiResponse<null>> {
    try {
      const budget = await Budget.findOneAndUpdate(
        { _id: budgetId, userId },
        { isActive: false },
        { new: true }
      );

      if (!budget) {
        return {
          success: false,
          message: 'Budget not found',
        };
      }

      return {
        success: true,
        message: 'Budget deleted successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to delete budget',
      };
    }
  }

  async updateBudgetSpent(userId: string, category: string, amount: number): Promise<void> {
    // Find active budget for this category
    const budget = await Budget.findOne({
      userId,
      category,
      isActive: true,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
    });

    if (budget) {
      budget.spent += amount;
      await budget.save();
    }
  }
}

export const budgetsService = new BudgetsService();
