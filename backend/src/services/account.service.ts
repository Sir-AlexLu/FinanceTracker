// src/services/account.service.ts
import { Account, IAccount } from '../models/Account.js';
import { Transaction } from '../models/Transaction.js';
import { logger } from '../utils/logger.js';
import { DEFAULT_ACCOUNT_NAMES } from '../config/constants.js';
import type { AccountType } from '../types/models.types.js';

export class AccountService {
  async create(userId: string, data: CreateAccountInput, ip: string, ua: string): Promise<IAccount> {
    const account = await Account.create({
      userId,
      type: data.type,
      name: data.name || DEFAULT_ACCOUNT_NAMES[data.type],
      balance: data.balance,
      openingBalance: data.balance,
      connection: data.connection,
      metadata: { defaultName: DEFAULT_ACCOUNT_NAMES[data.type] },
    });

    logger.info({ userId, accountId: account._id, ip, ua }, 'Account created');
    return account;
  }

  async getAll(userId: string, includeInactive = false): Promise<IAccount[]> {
    return Account.find({ userId, ...(includeInactive ? {} : { isActive: true }) }).sort({ createdAt: -1 });
  }

  async getById(userId: string, id: string): Promise<IAccount> {
    const account = await Account.findOne({ _id: id, userId });
    if (!account) throw new Error('Account not found');
    return account;
  }

  async update(userId: string, id: string, data: UpdateAccountInput, ip: string, ua: string): Promise<IAccount> {
    const account = await Account.findOne({ _id: id, userId });
    if (!account) throw new Error('Account not found');

    Object.assign(account, data);
    await account.save();

    logger.info({ userId, accountId: id, changes: data, ip, ua }, 'Account updated');
    return account;
  }

  async delete(userId: string, id: string, ip: string, ua: string): Promise<void> {
    const account = await Account.findOne({ _id: id, userId });
    if (!account) throw new Error('Account not found');

    const txCount = await Transaction.countDocuments({ $or: [{ accountId: id }, { destinationAccountId: id }] });

    if (txCount > 0) {
      account.isActive = false;
      await account.save();
      logger.warn({ userId, accountId: id, txCount, ip, ua }, 'Account deactivated (has transactions)');
    } else {
      await Account.findByIdAndDelete(id);
      logger.info({ userId, accountId: id, ip, ua }, 'Account deleted');
    }
  }

  async getSummary(userId: string): Promise<{
    total: number;
    byType: Record<AccountType, number>;
    liquidAssets: number;
    investments: number;
    loans: number;
  }> {
    const accounts = await Account.find({ userId, isActive: true });

    const byType = Object.values(AccountType).reduce((acc, type) => ({ ...acc, [type]: 0 }), {} as Record<AccountType, number>);
    let total = 0, liquid = 0, invest = 0, loans = 0;

    for (const a of accounts) {
      byType[a.type] += a.balance;
      if (a.type !== AccountType.LOANS) total += a.balance;
      if ([AccountType.CASH, AccountType.BANK, AccountType.SAVINGS].includes(a.type)) liquid += a.balance;
      if (a.type === AccountType.INVESTMENTS) invest += a.balance;
      if (a.type === AccountType.LOANS) loans += Math.abs(a.balance);
    }

    return { total, byType, liquidAssets: liquid, investments: invest, loans };
  }

  async updateBalance(accountId: string, amount: number): Promise<void> {
    const account = await Account.findById(accountId);
    if (!account) throw new Error('Account not found');

    account.balance += amount;
    account.metadata.lastTransactionAt = new Date();
    await account.save();

    // Trigger goal updates
    try {
      const { GoalService } = await import('./goal.service.js');
      const goals = await (await import('../models/Goal.js')).Goal.find({ userId: account.userId, linkedAccountId: accountId, status: 'active' });
      const goalSvc = new GoalService();
      for (const g of goals) await goalSvc.updateProgress(g._id.toString());
    } catch (err) {
      logger.error({ accountId, err }, 'Failed to update goals');
    }
  }
}
