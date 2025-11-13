import Transaction from '../models/Transaction';
import { AnalyticsData } from '../types/common';
import { ApiResponse } from '../types/common';

export class AnalyticsService {
  async getAnalytics(userId: string, params: any): Promise<ApiResponse<AnalyticsData>> {
    try {
      // Determine date range
      const now = new Date();
      let dateFilter: any = {};

      switch (params.period) {
        case 'current':
          dateFilter = {
            $gte: new Date(now.getFullYear(), now.getMonth(), 1),
            $lte: now,
          };
          break;
        case 'last30':
          dateFilter = {
            $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
            $lte: now,
          };
          break;
        case 'last90':
          dateFilter = {
            $gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
            $lte: now,
          };
          break;
        case 'thisYear':
          dateFilter = {
            $gte: new Date(now.getFullYear(), 0, 1),
            $lte: now,
          };
          break;
        case 'custom':
          if (params.startDate && params.endDate) {
            dateFilter = {
              $gte: new Date(params.startDate),
              $lte: new Date(params.endDate),
            };
          }
          break;
      }

      // Get transactions in the date range
      const transactions = await Transaction.find({
        userId,
        date: dateFilter,
      });

      // Calculate totals
      let totalIncome = 0;
      let totalExpense = 0;

      transactions.forEach(transaction => {
        if (transaction.type === 'income') {
          totalIncome += transaction.amount;
        } else if (transaction.type === 'expense') {
          totalExpense += transaction.amount;
        }
      });

      const netSavings = totalIncome - totalExpense;
      const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

      // Calculate expenses by category
      const expensesByCategoryMap = new Map();
      let totalExpenses = 0;

      transactions
        .filter(t => t.type === 'expense')
        .forEach(transaction => {
          const category = transaction.category;
          const amount = transaction.amount;
          
          expensesByCategoryMap.set(
            category,
            (expensesByCategoryMap.get(category) || 0) + amount
          );
          totalExpenses += amount;
        });

      const expensesByCategory = Array.from(expensesByCategoryMap.entries())
        .map(([category, amount]) => ({
          category,
          amount,
          percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
        }))
        .sort((a, b) => b.amount - a.amount);

      // Calculate income by category
      const incomeByCategoryMap = new Map();
      let totalIncomeAmount = 0;

      transactions
        .filter(t => t.type === 'income')
        .forEach(transaction => {
          const category = transaction.category;
          const amount = transaction.amount;
          
          incomeByCategoryMap.set(
            category,
            (incomeByCategoryMap.get(category) || 0) + amount
          );
          totalIncomeAmount += amount;
        });

      const incomeByCategory = Array.from(incomeByCategoryMap.entries())
        .map(([category, amount]) => ({
          category,
          amount,
          percentage: totalIncomeAmount > 0 ? (amount / totalIncomeAmount) * 100 : 0,
        }))
        .sort((a, b) => b.amount - a.amount);

      // Calculate monthly trend (last 6 months)
      const monthlyTrendMap = new Map();
      
      for (let i = 5; i >= 0; i--) {
        const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = month.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        
        monthlyTrendMap.set(monthKey, { income: 0, expense: 0, savings: 0 });
      }

      transactions.forEach(transaction => {
        const month = new Date(transaction.date);
        const monthKey = month.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        
        if (monthlyTrendMap.has(monthKey)) {
          const monthData = monthlyTrendMap.get(monthKey);
          
          if (transaction.type === 'income') {
            monthData.income += transaction.amount;
            monthData.savings += transaction.amount;
          } else if (transaction.type === 'expense') {
            monthData.expense += transaction.amount;
            monthData.savings -= transaction.amount;
          }
        }
      });

      const monthlyTrend = Array.from(monthlyTrendMap.entries()).map(([month, data]) => ({
        month,
        ...data,
      }));

      // Calculate cash flow (last 30 days)
      const cashFlowMap = new Map();
      
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateKey = date.toISOString().split('T')[0];
        
        cashFlowMap.set(dateKey, { inflow: 0, outflow: 0, netFlow: 0 });
      }

      transactions
        .filter(t => {
          const transactionDate = new Date(t.date);
          const daysDiff = Math.floor((now.getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24));
          return daysDiff <= 29 && daysDiff >= 0;
        })
        .forEach(transaction => {
          const dateKey = new Date(transaction.date).toISOString().split('T')[0];
          
          if (cashFlowMap.has(dateKey)) {
            const dayData = cashFlowMap.get(dateKey);
            
            if (transaction.type === 'income') {
              dayData.inflow += transaction.amount;
              dayData.netFlow += transaction.amount;
            } else if (transaction.type === 'expense') {
              dayData.outflow += transaction.amount;
              dayData.netFlow -= transaction.amount;
            }
          }
        });

      const cashFlow = Array.from(cashFlowMap.entries()).map(([date, data]) => ({
        date,
        ...data,
      }));

      const analyticsData: AnalyticsData = {
        totalIncome,
        totalExpense,
        netSavings,
        savingsRate,
        expensesByCategory,
        incomeByCategory,
        monthlyTrend,
        cashFlow,
      };

      return {
        success: true,
        data: analyticsData,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch analytics data',
      };
    }
  }
}

export const analyticsService = new AnalyticsService();
