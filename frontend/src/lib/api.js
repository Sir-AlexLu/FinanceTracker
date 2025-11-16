import axios from 'axios';
import { toast } from '@/components/Notifications';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authAPI = {
  register: async (data) => {
    try {
      const response = await api.post('/auth/register', data);
      return response;
    } catch (error) {
      toast.error('Registration failed');
      throw error;
    }
  },
  login: async (data) => {
    try {
      const response = await api.post('/auth/login', data);
      return response;
    } catch (error) {
      toast.error('Login failed');
      throw error;
    }
  },
  getMe: async () => {
    try {
      const response = await api.get('/auth/me');
      return response;
    } catch (error) {
      toast.error('Failed to fetch user details');
      throw error;
    }
  },
};

// Accounts API
export const accountsAPI = {
  getAll: async () => {
    try {
      const response = await api.get('/accounts');
      return response;
    } catch (error) {
      toast.error('Failed to fetch accounts');
      throw error;
    }
  },
  getOne: async (id) => {
    try {
      const response = await api.get(`/accounts/${id}`);
      return response;
    } catch (error) {
      toast.error('Failed to fetch account details');
      throw error;
    }
  },
  create: async (data) => {
    try {
      const response = await api.post('/accounts', data);
      return response;
    } catch (error) {
      toast.error('Failed to create account');
      throw error;
    }
  },
  update: async (id, data) => {
    try {
      const response = await api.put(`/accounts/${id}`, data);
      return response;
    } catch (error) {
      toast.error('Failed to update account');
      throw error;
    }
  },
  delete: async (id) => {
    try {
      const response = await api.delete(`/accounts/${id}`);
      return response;
    } catch (error) {
      toast.error('Failed to delete account');
      throw error;
    }
  },
  getBalance: async (id) => {
    try {
      const response = await api.get(`/accounts/${id}/balance`);
      return response;
    } catch (error) {
      toast.error('Failed to fetch account balance');
      throw error;
    }
  },
};

// Transactions API
export const transactionsAPI = {
  getAll: async (params) => {
    try {
      const response = await api.get('/transactions', { params });
      return response;
    } catch (error) {
      toast.error('Failed to fetch transactions');
      throw error;
    }
  },
  getOne: async (id) => {
    try {
      const response = await api.get(`/transactions/${id}`);
      return response;
    } catch (error) {
      toast.error('Failed to fetch transaction details');
      throw error;
    }
  },
  create: async (data) => {
    try {
      const response = await api.post('/transactions', data);
      return response;
    } catch (error) {
      toast.error('Failed to create transaction');
      throw error;
    }
  },
  transfer: async (data) => {
    try {
      const response = await api.post('/transactions/transfer', data);
      return response;
    } catch (error) {
      toast.error('Transfer failed');
      throw error;
    }
  },
  update: async (id, data) => {
    try {
      const response = await api.put(`/transactions/${id}`, data);
      return response;
    } catch (error) {
      toast.error('Failed to update transaction');
      throw error;
    }
  },
  delete: async (id) => {
    try {
      const response = await api.delete(`/transactions/${id}`);
      return response;
    } catch (error) {
      toast.error('Failed to delete transaction');
      throw error;
    }
  },
  getAnalytics: async (params) => {
    try {
      const response = await api.get('/transactions/analytics', { params });
      return response;
    } catch (error) {
      toast.error('Failed to fetch analytics');
      throw error;
    }
  },
};
