import Account from '../models/Account.js';
import Transaction from '../models/Transaction.js';

// Get all accounts for user
export const getAccounts = async (request, reply) => {
  try {
    const accounts = await Account.find({ userId: request.userId, isActive: true })
      .sort({ createdAt: -1 });

    reply.send({
      success: true,
      data: { accounts },
    });
  } catch (error) {
    reply.code(500).send({
      success: false,
      message: error.message,
    });
  }
};

// Get single account
export const getAccount = async (request, reply) => {
  try {
    const { id } = request.params;

    const account = await Account.findOne({
      _id: id,
      userId: request.userId,
    });

    if (!account) {
      return reply.code(404).send({
        success: false,
        message: 'Account not found',
      });
    }

    reply.send({
      success: true,
      data: { account },
    });
  } catch (error) {
    reply.code(500).send({
      success: false,
      message: error.message,
    });
  }
};

// Create new account
export const createAccount = async (request, reply) => {
  try {
    const { name, type, balance, currency, description } = request.body;

    // Validation
    if (!name || !type) {
      return reply.code(400).send({
        success: false,
        message: 'Please provide account name and type',
      });
    }

    const account = await Account.create({
      userId: request.userId,
      name,
      type,
      balance: balance || 0,
      currency: currency || 'USD',
      description,
    });

    reply.code(201).send({
      success: true,
      message: 'Account created successfully',
      data: { account },
    });
  } catch (error) {
    reply.code(500).send({
      success: false,
      message: error.message,
    });
  }
};

// Update account
export const updateAccount = async (request, reply) => {
  try {
    const { id } = request.params;
    const { name, type, description } = request.body;

    const account = await Account.findOneAndUpdate(
      { _id: id, userId: request.userId },
      { name, type, description },
      { new: true, runValidators: true }
    );

    if (!account) {
      return reply.code(404).send({
        success: false,
        message: 'Account not found',
      });
    }

    reply.send({
      success: true,
      message: 'Account updated successfully',
      data: { account },
    });
  } catch (error) {
    reply.code(500).send({
      success: false,
      message: error.message,
    });
  }
};

// Delete account (soft delete)
export const deleteAccount = async (request, reply) => {
  try {
    const { id } = request.params;

    const account = await Account.findOneAndUpdate(
      { _id: id, userId: request.userId },
      { isActive: false },
      { new: true }
    );

    if (!account) {
      return reply.code(404).send({
        success: false,
        message: 'Account not found',
      });
    }

    reply.send({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    reply.code(500).send({
      success: false,
      message: error.message,
    });
  }
};

// Get account balance
export const getAccountBalance = async (request, reply) => {
  try {
    const { id } = request.params;

    const account = await Account.findOne({
      _id: id,
      userId: request.userId,
    });

    if (!account) {
      return reply.code(404).send({
        success: false,
        message: 'Account not found',
      });
    }

    reply.send({
      success: true,
      data: {
        balance: account.balance,
        currency: account.currency,
      },
    });
  } catch (error) {
    reply.code(500).send({
      success: false,
      message: error.message,
    });
  }
};
