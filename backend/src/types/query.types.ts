export interface BillQueryParams {
  status?: 'upcoming' | 'overdue' | 'paid' | 'partially_paid';
  category?: string;
  page?: string;
  limit?: string;
  startDate?: string;
  endDate?: string;
}

export interface BudgetQueryParams {
  category?: string;
  month?: string;
  year?: string;
  page?: string;
  limit?: string;
}

export interface GoalQueryParams {
  status?: string;
  type?: string;
  page?: string;
  limit?: string;
}

export interface LiabilityQueryParams {
  type?: string;
  page?: string;
  limit?: string;
}

export interface NotificationQueryParams {
  isRead?: string | boolean;
  type?: string;
  page?: string;
  limit?: string;
}

export interface AccountQueryParams {
  includeInactive?: string;
}

export interface TransactionQueryParams {
  type?: string;
  category?: string;
  accountId?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: string;
  maxAmount?: string;
  page?: string;
  limit?: string;
}

export interface SettlementQueryParams {
  month?: string;
  year?: string;
  page?: string;
  limit?: string;
}
