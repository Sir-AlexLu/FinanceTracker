import Bill from '@/models/Bill';
import { IBill } from '@/types/database';
import { ApiResponse } from '@/types/common';

export class BillsService {
  async getBills(userId: string): Promise<ApiResponse<IBill[]>> {
    try {
      const bills = await Bill.find({ userId, isActive: true })
        .populate('accountId', 'name type')
        .sort({ dueDate: 1 });

      return {
        success: true,
        data: bills,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch bills',
      };
    }
  }

  async getBillById(userId: string, billId: string): Promise<ApiResponse<IBill>> {
    try {
      const bill = await Bill.findOne({
        _id: billId,
        userId,
        isActive: true,
      })
        .populate('accountId', 'name type');

      if (!bill) {
        return {
          success: false,
          message: 'Bill not found',
        };
      }

      return {
        success: true,
        data: bill,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch bill',
      };
    }
  }

  async createBill(userId: string, billData: any): Promise<ApiResponse<IBill>> {
    try {
      const bill = new Bill({
        ...billData,
        userId,
      });

      await bill.save();

      // Populate account details for response
      await bill.populate('accountId', 'name type');

      return {
        success: true,
        data: bill,
        message: 'Bill created successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to create bill',
      };
    }
  }

  async updateBill(
    userId: string, 
    billId: string, 
    billData: any
  ): Promise<ApiResponse<IBill>> {
    try {
      const bill = await Bill.findOneAndUpdate(
        { _id: billId, userId },
        billData,
        { new: true, runValidators: true }
      );

      if (!bill) {
        return {
          success: false,
          message: 'Bill not found',
        };
      }

      // Populate account details for response
      await bill.populate('accountId', 'name type');

      return {
        success: true,
        data: bill,
        message: 'Bill updated successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to update bill',
      };
    }
  }

  async deleteBill(userId: string, billId: string): Promise<ApiResponse<null>> {
    try {
      const bill = await Bill.findOneAndUpdate(
        { _id: billId, userId },
        { isActive: false },
        { new: true }
      );

      if (!bill) {
        return {
          success: false,
          message: 'Bill not found',
        };
      }

      return {
        success: true,
        message: 'Bill deleted successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to delete bill',
      };
    }
  }

  async getUpcomingBills(userId: string, days = 7): Promise<ApiResponse<IBill[]>> {
    try {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);

      const bills = await Bill.find({
        userId,
        isActive: true,
        isPaid: false,
        dueDate: { $lte: futureDate },
      })
        .populate('accountId', 'name type')
        .sort({ dueDate: 1 });

      return {
        success: true,
        data: bills,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch upcoming bills',
      };
    }
  }

  async getOverdueBills(userId: string): Promise<ApiResponse<IBill[]>> {
    try {
      const today = new Date();
      today.setHours(23, 59, 59, 999);

      const bills = await Bill.find({
        userId,
        isActive: true,
        isPaid: false,
        dueDate: { $lt: today },
      })
        .populate('accountId', 'name type')
        .sort({ dueDate: 1 });

      return {
        success: true,
        data: bills,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch overdue bills',
      };
    }
  }
}

export const billsService = new BillsService();
