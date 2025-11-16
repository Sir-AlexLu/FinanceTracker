// File: FinanceTracker/backend/src/controllers/transaction.controller.js
import { Transaction, CATEGORIES } from '../models/Transaction.js';
import { formatSuccessResponse, formatErrorResponse, buildMongoQuery, parseSortQuery } from '../utils/helpers.js';

export const createTransaction = async (request, reply) => {
  try {
    const { type, amount, category, description, date } = request.body;
    const userId = request.user.userId;

    const transaction = new Transaction({
      userId,
      type,
      amount,
      category,
      description,
      date: date || new Date()
    });

    await transaction.save();

    return reply.status(201).send(
      formatSuccessResponse(
        { transaction },
        'Transaction created successfully'
      )
    );
  } catch (error) {
    console.error('Create transaction error:', error);
    return reply.status(500).send(
      formatErrorResponse('Failed to create transaction', error.message)
    );
  }
};

export const getTransactions = async (request, reply) => {
  try {
    const userId = request.user.userId;
    const { page = 1, limit = 10, sort = '-date', ...filters } = request.query;

    const query = { userId, ...buildMongoQuery(filters) };
    const sortOptions = parseSortQuery(sort);

    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      Transaction
        .find(query)
        .sort(sortOptions)
        .limit(limit)
        .skip(skip)
        .lean(),
      Transaction.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit);

    return reply.send(
      formatSuccessResponse(
        {
          transactions,
          pagination: {
            total,
            page,
            limit,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
          }
        },
        'Transactions retrieved successfully'
      )
    );
  } catch (error) {
    console.error('Get transactions error:', error);
    return reply.status(500).send(
      formatErrorResponse('Failed to get transactions', error.message)
    );
  }
};

export const getTransaction = async (request, reply) => {
  try {
    const { id } = request.params;
    const userId = request.user.userId;

    const transaction = await Transaction.findOne({ _id: id, userId });

    if (!transaction) {
      return reply.status(404).send(
        formatErrorResponse('Transaction not found', 'The requested transaction does not exist')
      );
    }

    return reply.send(
      formatSuccessResponse(
        { transaction },
        'Transaction retrieved successfully'
      )
    );
  } catch (error) {
    console.error('Get transaction error:', error);
    return reply.status(500).send(
      formatErrorResponse('Failed to get transaction', error.message)
    );
  }
};

export const updateTransaction = async (request, reply) => {
  try {
    const { id } = request.params;
    const userId = request.user.userId;
    const updates = request.body;

    // Validate category if type is being changed
    if (updates.type && updates.category) {
      const validCategories = updates.type === 'income' ? CATEGORIES.INCOME : CATEGORIES.EXPENSE;
      if (!validCategories.includes(updates.category)) {
        return reply.status(400).send(
          formatErrorResponse('Invalid category', `Invalid category for ${updates.type} type`)
        );
      }
    }

    const transaction = await Transaction.findOneAndUpdate(
      { _id: id, userId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!transaction) {
      return reply.status(404).send(
        formatErrorResponse('Transaction not found', 'The requested transaction does not exist')
      );
    }

    return reply.send(
      formatSuccessResponse(
        { transaction },
        'Transaction updated successfully'
      )
    );
  } catch (error) {
    console.error('Update transaction error:', error);
    return reply.status(500).send(
      formatErrorResponse('Failed to update transaction', error.message)
    );
  }
};

export const deleteTransaction = async (request, reply) => {
  try {
    const { id } = request.params;
    const userId = request.user.userId;

    const transaction = await Transaction.findOneAndDelete({ _id: id, userId });

    if (!transaction) {
      return reply.status(404).send(
        formatErrorResponse('Transaction not found', 'The requested transaction does not exist')
      );
    }

    return reply.send(
      formatSuccessResponse(
        { transaction },
        'Transaction deleted successfully'
      )
    );
  } catch (error) {
    console.error('Delete transaction error:', error);
    return reply.status(500).send(
      formatErrorResponse('Failed to delete transaction', error.message)
    );
  }
};

export const getSummary = async (request, reply) => {
  try {
    const userId = request.user.userId;
    const { dateFrom, dateTo } = request.query;

    const summary = await Transaction.getSummary(userId, dateFrom, dateTo);

    // Get current year monthly breakdown
    const currentYear = new Date().getFullYear();
    const monthlyBreakdown = await Transaction.getMonthlyBreakdown(userId, currentYear);

    // Get category-wise breakdown
    const match = { userId };
    if (dateFrom || dateTo) {
      match.date = {};
      if (dateFrom) match.date.$gte = new Date(dateFrom);
      if (dateTo) match.date.$lte = new Date(dateTo);
    }

    const categoryBreakdown = await Transaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: { type: '$type', category: '$category' },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } }
    ]);

    const formattedCategoryBreakdown = {
      income: [],
      expense: []
    };

    categoryBreakdown.forEach(item => {
      const data = {
        category: item._id.category,
        total: item.total,
        count: item.count
      };
      
      if (item._id.type === 'income') {
        formattedCategoryBreakdown.income.push(data);
      } else {
        formattedCategoryBreakdown.expense.push(data);
      }
    });

    return reply.send(
      formatSuccessResponse(
        {
          summary,
          monthlyBreakdown,
          categoryBreakdown: formattedCategoryBreakdown,
          period: {
            from: dateFrom || 'all-time',
            to: dateTo || 'current',
            year: currentYear
          }
        },
        'Summary retrieved successfully'
      )
    );
  } catch (error) {
    console.error('Get summary error:', error);
    return reply.status(500).send(
      formatErrorResponse('Failed to get summary', error.message)
    );
  }
};
