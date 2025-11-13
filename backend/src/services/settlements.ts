import Settlement from '@/models/Settlement';
import { ISettlement } from '@/types/database';
import { ApiResponse } from '@/types/common';

export class SettlementsService {
  async getSettlements(userId: string): Promise<ApiResponse<ISettlement[]>> {
    try {
      const settlements = await Settlement.find({ userId })
        .sort({ startDate: -1 });

      return {
        success: true,
        data: settlements,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch settlements',
      };
    }
  }

  async getSettlementById(userId: string, settlementId: string): Promise<ApiResponse<ISettlement>> {
    try {
      const settlement = await Settlement.findOne({
        _id: settlementId,
        userId,
      });

      if (!settlement) {
        return {
          success: false,
          message: 'Settlement not found',
        };
      }

      return {
        success: true,
        data: settlement,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch settlement',
      };
    }
  }

  async createSettlement(userId: string, settlementData: any): Promise<ApiResponse<ISettlement>> {
    try {
      // Calculate net amount
      const netAmount = settlementData.totalIncome - settlementData.totalExpense;

      const settlement = new Settlement({
        ...settlementData,
        netAmount,
        userId,
      });

      await settlement.save();

      return {
        success: true,
        data: settlement,
        message: 'Settlement created successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to create settlement',
      };
    }
  }

  async updateSettlement(
    userId: string, 
    settlementId: string, 
    settlementData: any
  ): Promise<ApiResponse<ISettlement>> {
    try {
      // Calculate net amount if income or expense is provided
      if (settlementData.totalIncome !== undefined || settlementData.totalExpense !== undefined) {
        const settlement = await Settlement.findOne({
          _id: settlementId,
          userId,
        });

        if (!settlement) {
          return {
            success: false,
            message: 'Settlement not found',
          };
        }

        const totalIncome = settlementData.totalIncome !== undefined 
          ? settlementData.totalIncome 
          : settlement.totalIncome;
        
        const totalExpense = settlementData.totalExpense !== undefined 
          ? settlementData.totalExpense 
          : settlement.totalExpense;

        settlementData.netAmount = totalIncome - totalExpense;
      }

      const updatedSettlement = await Settlement.findOneAndUpdate(
        { _id: settlementId, userId },
        settlementData,
        { new: true, runValidators: true }
      );

      if (!updatedSettlement) {
        return {
          success: false,
          message: 'Settlement not found',
        };
      }

      return {
        success: true,
        data: updatedSettlement,
        message: 'Settlement updated successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to update settlement',
      };
    }
  }

  async deleteSettlement(userId: string, settlementId: string): Promise<ApiResponse<null>> {
    try {
      const settlement = await Settlement.findOneAndDelete({
        _id: settlementId,
        userId,
      });

      if (!settlement) {
        return {
          success: false,
          message: 'Settlement not found',
        };
      }

      return {
        success: true,
        message: 'Settlement deleted successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to delete settlement',
      };
    }
  }

  async getPendingSettlements(userId: string): Promise<ApiResponse<any>> {
    try {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      // Check for pending monthly settlement
      const lastMonthlySettlement = await Settlement.findOne({
        userId,
        type: 'monthly',
      }).sort({ startDate: -1 });

      let pendingMonthly = null;
      if (lastMonthlySettlement) {
        const settlementMonth = new Date(lastMonthlySettlement.startDate).getMonth();
        const settlementYear = new Date(lastMonthlySettlement.startDate).getFullYear();
        
        if (settlementMonth < currentMonth || settlementYear < currentYear) {
          pendingMonthly = {
            type: 'monthly',
            period: `${new Date(lastMonthlySettlement.startDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
          };
        }
      }

      // Check for pending yearly settlement
      const lastYearlySettlement = await Settlement.findOne({
        userId,
        type: 'yearly',
      }).sort({ startDate: -1 });

      let pendingYearly = null;
      if (lastYearlySettlement) {
        const settlementYear = new Date(lastYearlySettlement.startDate).getFullYear();
        
        if (settlementYear < currentYear) {
          pendingYearly = {
            type: 'yearly',
            period: settlementYear.toString(),
          };
        }
      }

      return {
        success: true,
        data: {
          pendingMonthly,
          pendingYearly,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to check pending settlements',
      };
    }
  }

  async triggerAutoSettlement(userId: string, type: 'monthly' | 'yearly'): Promise<ApiResponse<ISettlement>> {
    try {
      const now = new Date();
      let startDate, endDate, period;

      if (type === 'monthly') {
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        period = startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      } else {
        startDate = new Date(now.getFullYear() - 1, 0, 1);
        endDate = new Date(now.getFullYear() - 1, 11, 31);
        period = startDate.getFullYear().toString();
      }

      // Calculate totals from transactions (this would need to import Transaction model)
      // For now, we'll use placeholder values
      const totalIncome = 0;
      const totalExpense = 0;

      const settlementData = {
        type,
        period,
        startDate,
        endDate,
        totalIncome,
        totalExpense,
        isCompleted: true,
      };

      return this.createSettlement(userId, settlementData);
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to trigger settlement',
      };
    }
  }
}

export const settlementsService = new SettlementsService();
