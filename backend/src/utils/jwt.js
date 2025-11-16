// File: FinanceTracker/backend/src/utils/jwt.js
import jwt from 'jsonwebtoken';
import { config } from '../config/environment.js';

export const generateToken = (payload) => {
  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRY
  });
};

export const verifyToken = (token) => {
  return jwt.verify(token, config.JWT_SECRET);
};

export const setAuthCookie = (reply, token) => {
  reply.setCookie('token', token, {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: config.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
    domain: config.NODE_ENV === 'production' ? config.COOKIE_DOMAIN : undefined
  });
};

export const clearAuthCookie = (reply) => {
  reply.clearCookie('token', {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: config.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
    domain: config.NODE_ENV === 'production' ? config.COOKIE_DOMAIN : undefined
  });
};
