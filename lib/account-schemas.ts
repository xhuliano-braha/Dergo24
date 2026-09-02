import { z } from 'zod';

export const customerLoginSchema = z.object({
  email: z.email().trim().max(160),
  password: z.string().min(8).max(128),
});

export const customerRegisterSchema = customerLoginSchema.extend({
  fullName: z.string().trim().min(2).max(80),
  phone: z.string().trim().regex(/^\+?[0-9 ]{8,16}$/),
});

export const passwordChangeSchema = z.object({
  newPassword: z.string().min(8).max(128),
});

export const staffAccountCreateSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  login: z.string().trim().min(3).max(160),
  password: z.string().min(8).max(128),
  role: z.enum(['admin', 'dispatcher', 'support']),
});

export const staffAccountUpdateSchema = z.object({
  role: z.enum(['admin', 'dispatcher', 'support']),
  active: z.boolean(),
  newPassword: z.string().min(8).max(128).optional(),
});
