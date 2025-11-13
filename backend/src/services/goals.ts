import Goal from '@/models/Goal';
import { IGoal } from '@/types/database';
import { ApiResponse } from '@/types/common';

export class GoalsService {
  async getGoals(userId: string): Promise<ApiResponse<IGoal[]>> {
    try {
      const goals = await Goal.find({ userId, isActive: true })
        .sort({ targetDate: 1 });

      return {
        success: true,
        data: goals,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch goals',
      };
    }
  }

  async getGoalById(userId: string, goalId: string): Promise<ApiResponse<IGoal>> {
    try {
      const goal = await Goal.findOne({
        _id: goalId,
        userId,
        isActive: true,
      });

      if (!goal) {
        return {
          success: false,
          message: 'Goal not found',
        };
      }

      return {
        success: true,
        data: goal,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch goal',
      };
    }
  }

  async createGoal(userId: string, goalData: any): Promise<ApiResponse<IGoal>> {
    try {
      const goal = new Goal({
        ...goalData,
        userId,
      });

      await goal.save();

      return {
        success: true,
        data: goal,
        message: 'Goal created successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to create goal',
      };
    }
  }

  async updateGoal(
    userId: string, 
    goalId: string, 
    goalData: any
  ): Promise<ApiResponse<IGoal>> {
    try {
      const goal = await Goal.findOneAndUpdate(
        { _id: goalId, userId },
        goalData,
        { new: true, runValidators: true }
      );

      if (!goal) {
        return {
          success: false,
          message: 'Goal not found',
        };
      }

      return {
        success: true,
        data: goal,
        message: 'Goal updated successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to update goal',
      };
    }
  }

  async deleteGoal(userId: string, goalId: string): Promise<ApiResponse<null>> {
    try {
      const goal = await Goal.findOneAndUpdate(
        { _id: goalId, userId },
        { isActive: false },
        { new: true }
      );

      if (!goal) {
        return {
          success: false,
          message: 'Goal not found',
        };
      }

      return {
        success: true,
        message: 'Goal deleted successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to delete goal',
      };
    }
  }

  async updateGoalProgress(userId: string, category: string, amount: number): Promise<void> {
    // Find active goal for this category
    const goal = await Goal.findOne({
      userId,
      category,
      isActive: true,
    });

    if (goal) {
      goal.currentAmount += amount;
      await goal.save();
    }
  }
}

export const goalsService = new GoalsService();
