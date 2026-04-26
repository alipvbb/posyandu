import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    villageName: z.string().min(3),
    villageCode: z.string().min(3).max(32).optional(),
    adminName: z.string().min(3),
    email: z.string().email(),
    phone: z.string().optional().nullable(),
    password: z.string().min(6),
  }),
});

export const verifyRegisterSchema = z.object({
  body: z.object({
    email: z.string().email(),
    code: z.string().min(4).max(8),
  }),
});

export const resendRegisterCodeSchema = z.object({
  body: z.object({
    email: z.string().email(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
  }),
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(10),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(6),
    newPassword: z.string().min(6),
  }),
});
