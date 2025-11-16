// File: FinanceTracker/backend/src/models/Transaction.js
import mongoose from 'mongoose';

const INCOME_CATEGORIES = ['Salary', 'Business', 'Allowance', 'OtherIncome'];
const EXPENSE_CATEGORIES = ['Groceries', 'FoodDining', 'Transportation', 'Education', 'Health', 'OtherExpense'];
const ALL_CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: [true, 'Transaction type is required'],
      index: true
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
      max: [1000000000, 'Amount is too large']
    },
    category: {
      type: String,
      enum: ALL_CATEGORIES,
      required: [true, 'Category is required'],
      index: true
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description must not exceed 500 characters']
    },
    date: {
      type: Date,
      required: [true, 'Transaction date is required'],
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Compound indexes for common queries
transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, type: 1, date: -1 });
transactionSchema.index({ userId: 1, category: 1, date: -1 });

// Validate category based on transaction type
transactionSchema.pre('validate', function(next) {
  if (this.type === 'income' && !INCOME_CATEGORIES.includes(this.category)) {
    this.invalidate('category', `Invalid income category: ${this.category}`);
  } else if (this.type === 'expense' && !EXPENSE_CATEGORIES.includes(this.category)) {
    this.invalidate('category', `Invalid expense category: ${this.category}`);
  }
  next();
});

// Static methods for aggregations
transactionSchema.statics.getSummary = async function(userId, startDate, endDate) {
  const match = { userId: mongoose.Types.ObjectId.createFromHexString(userId) };
  
  if (startDate || endDate) {
    match.date = {};
    if (startDate) match.date.$gte = new Date(startDate);
    if (endDate) match.date.$lte = new Date(endDate);
  }

  const result = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$type',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);

  const summary = {
    income: { total: 0, count: 0 },
    expense: { total: 0, count: 0 },
    balance: 0
  };

  result.forEach(item => {
    if (item._id === 'income') {
      summary.income = { total: item.total, count: item.count };
    } else if (item._id === 'expense') {
      summary.expense = { total: item.total, count: item.count };
    }
  });

  summary.balance = summary.income.total - summary.expense.total;
  return summary;
};

transactionSchema.statics.getMonthlyBreakdown = async function(userId, year) {
  const startDate = new Date(`${year}-01-01`);
  const endDate = new Date(`${year}-12-31`);

  const result = await this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId.createFromHexString(userId),
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          month: { $month: '$date' },
          type: '$type'
        },
        total: { $sum: '$amount' }
      }
    },
    {
      $sort: { '_id.month': 1 }
    }
  ]);

  // Format into monthly data
  const monthlyData = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    income: 0,
    expense: 0
  }));

  result.forEach(item => {
    const monthIndex = item._id.month - 1;
    if (item._id.type === 'income') {
      monthlyData[monthIndex].income = item.total;
    } else {
      monthlyData[monthIndex].expense = item.total;
    }
  });

  return monthlyData;
};

export const Transaction = mongoose.model('Transaction', transactionSchema);

export const CATEGORIES = {
  INCOME: INCOME_CATEGORIES,
  EXPENSE: EXPENSE_CATEGORIES,
  ALL: ALL_CATEGORIES
};
