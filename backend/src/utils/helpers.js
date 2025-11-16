// File: FinanceTracker/backend/src/utils/helpers.js
export const formatSuccessResponse = (data, message = 'Success') => {
  return {
    success: true,
    message,
    data
  };
};

export const formatErrorResponse = (error, message = 'An error occurred') => {
  return {
    success: false,
    error,
    message
  };
};

export const sanitizeUser = (user) => {
  const sanitized = user.toObject ? user.toObject() : { ...user };
  delete sanitized.passwordHash;
  delete sanitized.__v;
  return sanitized;
};

export const buildMongoQuery = (filters) => {
  const query = {};
  
  if (filters.type) {
    query.type = filters.type;
  }
  
  if (filters.category) {
    query.category = filters.category;
  }
  
  if (filters.dateFrom || filters.dateTo) {
    query.date = {};
    if (filters.dateFrom) {
      query.date.$gte = new Date(filters.dateFrom);
    }
    if (filters.dateTo) {
      query.date.$lte = new Date(filters.dateTo);
    }
  }
  
  return query;
};

export const parseSortQuery = (sortString) => {
  const sortOptions = {
    'date': { date: 1 },
    '-date': { date: -1 },
    'amount': { amount: 1 },
    '-amount': { amount: -1 }
  };
  
  return sortOptions[sortString] || { date: -1 };
};
