import Transaction from '../models/Transaction.js';
import Account from '../models/Account.js';
import mongoose from 'mongoose';

// Get all transactions
export const getTransactions = async (request, reply) => {
  try {
    const { accountId, type, startDate, endDate, limit = 50 } = request.query;

    const query = { userId: request.userId };

    if (accountId) query.accountId = accountId;
    if (type) query.type = type;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(query)
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .populate('accountId', 'name type')
      .populate('toAccountId', 'name type');

    reply.send({
      success: true,
      data: { transactions },
    });
  } catch (error) {
    reply.code(500).send({
      success: false,
      message: error.message,
    });
  }
};

// Get single transaction
export const getTransaction = async (request, reply) => {
  try {
    const { id } = request.params;

    const transaction = await Transaction.findOne({
      _id: id,
      userId: request.userId,
    })
      .populate('accountId', 'name type')
      .populate('toAccountId', 'name type');

    if (!transaction) {
      return reply.code(404).send({
        success: false,
        message: 'Transaction not found',
      });
    }

    reply.send({
      success: true,
      data: { transaction },
    });
  } catch (error) {
    reply.code(500).send({
      success: false,
      message: error.message,
    });
  }
};

// Create transaction
export const createTransaction = async (request, reply) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { accountId, type, amount, category, description, date } = request.body;

    // Validation
    if (!accountId || !type || !amount || !category) {
      return reply.code(400).send({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    // Verify account belongs to user
    const account = await Account.findOne({
      _id: accountId,
      userId: request.userId,
    });

    if (!account) {
      return reply.code(404).send({
        success: false,
        message: 'Account not found',
      });
    }

    // Create transaction
    const transaction = await Transaction.create([{
      userId: request.userId,
      accountId,
      type,
      amount,
      category,
      description,
      date: date || new Date(),
    }], { session });

    // Update account balance
    const balanceChange = type === 'income' ? parseFloat(amount) : -parseFloat(amount);
    await Account.findByIdAndUpdate(
      accountId,
      { $inc: { balance: balanceChange } },
      { session }
    );

    await session.commitTransaction();

    reply.code(201).send({
      success: true,
      message: 'Transaction created successfully',
      data: { transaction: transaction[0] },
    });
  } catch (error) {
    await session.abortTransaction();
    reply.code(500).send({
      success: false,
      message: error.message,
    });
  } finally {
    session.endSession();
  }
};

// Transfer between accounts
export const transferBetweenAccounts = async (request, reply) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { fromAccountId, toAccountId, amount, description, date } = request.body;

    // Validation
    if (!fromAccountId || !toAccountId || !amount) {
      return reply.code(400).send({
        success: false,
        message: 'Please provide from account, to account, and amount',
      });
    }

    if (fromAccountId === toAccountId) {
      return reply.code(400).send({
        success: false,
        message: 'Cannot transfer to the same account',
      });
    }

    // Verify both accounts belong to user
    const [fromAccount, toAccount] = await Promise.all([
      Account.findOne({ _id: fromAccountId, userId: request.userId }),
      Account.findOne({ _id: toAccountId, userId: request.userId }),
    ]);

    if (!fromAccount || !toAccount) {
      return reply.code(404).send({
        success: false,
        message: 'One or both accounts not found',
      });
    }

    // Check sufficient balance
    if (parseFloat(fromAccount.balance) < parseFloat(amount)) {
      return reply.code(400).send({
        success: false,
        message: 'Insufficient balance',
      });
    }

    // Create transfer transaction
    const transaction = await Transaction.create([{
      userId: request.userId,
      accountId: fromAccountId,
      type: 'transfer',
      amount,
      category: 'Transfer',
      description: description || `Transfer to ${toAccount.name}`,
      date: date || new Date(),
      toAccountId,
    }], { session });

    // Update account balances
    await Promise.all([
      Account.findByIdAndUpdate(
        fromAccountId,
        { $inc: { balance: -parseFloat(amount) } },
        { session }
      ),
      Account.findByIdAndUpdate(
        toAccountId,
        { $inc: { balance: parseFloat(amount) } },
        { session }
      ),
    ]);

    await session.commitTransaction();

    reply.code(201).send({
      success: true,
      message: 'Transfer completed successfully',
      data: { transaction: transaction[0] },
    });
  } catch (error) {
    await session.abortTransaction();
    reply.code(500).send({
      success: false,
      message: error.message,
    });
  } finally {
    session.endSession();
  }
};

// Update transaction
export const updateTransaction = async (request, reply) => {
  try {
    const { id } = request.params;
    const { category, description, date } = request.body;

    const transaction = await Transaction.findOneAndUpdate(
      { _id: id, userId: request.userId },
      { category, description, date },
      { new: true, runValidators: true }
    );

    if (!transaction) {
      return reply.code(404).send({
        success: false,
        message: 'Transaction not found',
      });
    }

    reply.send({
      success: true,
      message: 'Transaction updated successfully',
      data: { transaction },
    });
  } catch (error) {
    reply.code(500).send({
      success: false,
      message: error.message,
    });
  }
};

// Delete transaction
export const deleteTransaction = async (request, reply) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = request.params;

    const transaction = await Transaction.findOne({
      _id: id,
      userId: request.userId,
    });

    if (!transaction) {
      return reply.code(404).send({
        success: false,
        message: 'Transaction not found',
      });
    }

    // Reverse the balance change
    const balanceChange = transaction.type === 'income' 
      ? -parseFloat(transaction.amount) 
      : parseFloat(transaction.amount);

    await Account.findByIdAndUpdate(
      transaction.accountId,
      { $inc: { balance: balanceChange } },
      { session }
    );

    // If it's a transfer, update the destination account too
    if (transaction.type === 'transfer' && transaction.toAccountId) {
      await Account.findByIdAndUpdate(
        transaction.toAccountId,
        { $inc: { balance: -parseFloat(transaction.amount) } },
        { session }
      );
    }

    await Transaction.findByIdAndDelete(id, { session });

    await session.commitTransaction();

    reply.send({
      success: true,
      message: 'Transaction deleted successfully',
    });
  } catch (error) {
    await session.abortTransaction();
    reply.code(500).send({
      success: false,
      message: error.message,
    });
  } finally {
    session.endSession();
  }
};

// Get analytics
export const getAnalytics = async (request, reply) => {
  try {
    const { startDate, endDate } = request.query;

    const query = { userId: request.userId };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(query);

    let totalIncome = 0;
    let totalExpense = 0;
    const categoryBreakdown = {};

    transactions.forEach((transaction) => {
      const amount = parseFloat(transaction.amount);
      
      if (transaction.type === 'income') {
        totalIncome += amount;
      } else if (transaction.type === 'expense') {
        totalExpense += amount;
        
        if (!categoryBreakdown[transaction.category]) {
          categoryBreakdown[transaction.category] = 0;
        }
        categoryBreakdown[transaction.category] += amount;
      }
    });

    const netSavings = totalIncome - totalExpense;

    reply.send({
      success: true,
      data: {
        totalIncome: totalIncome.toFixed(2),
        totalExpense: totalExpense.toFixed(2),
        netSavings: netSavings.toFixed(2),
        categoryBreakdown,
        transactionCount: transactions.length,
      },
    });
  } catch (error) {
    reply.code(500).send({
      success: false,
      message: error.message,
    });
  }
};
