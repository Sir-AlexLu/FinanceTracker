// src/schemas/auth.schema.ts
import { z } from 'zod';

const email = z.string().email().toLowerCase().trim();
const password = z.string().min(8).max(100);

export const registerSchema = z.object({
  email,
  password,
  name: z.string().min(2).max(50).trim(),
  phoneNumber: z.string().regex(/^[0-9]{10}$/).optional(),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: password,
});

export const forgotPasswordSchema = z.object({
  email,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: password,
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(50).trim().optional(),
  phoneNumber: z.string().regex(/^[0-9]{10}$/).optional(),
  preferences: z
    .object({
      currency: z.enum(['INR']).optional(),
      dateFormat: z.enum(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']).optional(),
      notifications: z
        .object({
          email: z.boolean().optional(),
          push: z.boolean().optional(),
          billReminders: z.boolean().optional(),
          budgetAlerts: z.boolean().optional(),
          goalMilestones: z.boolean().optional(),
        })
        .optional(),
    })
    .optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
