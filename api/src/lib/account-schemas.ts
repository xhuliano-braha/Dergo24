import { z } from 'zod';
import { permissionCodes } from '../types/profiles';

export const customerLoginSchema = z.object({
  email: z.email().trim().max(160),
  password: z.string().min(8).max(128),
});

export const customerRegisterSchema = customerLoginSchema.extend({
  fullName: z.string().trim().min(2).max(80),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ]{8,16}$/),
  acceptedTerms: z.literal(true),
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(8).max(128),
});

export const staffAccountCreateSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  login: z.string().trim().min(3).max(160),
  password: z.string().min(8).max(128),
  role: z.enum(['admin', 'dispatcher', 'support', 'courier']),
});

export const staffAccountUpdateSchema = z.object({
  role: z.enum(['admin', 'dispatcher', 'support', 'courier']),
  active: z.boolean(),
  newPassword: z.string().min(8).max(128).optional(),
});

export const rolePermissionsUpdateSchema = z.object({
  permissions: z.array(z.enum(permissionCodes)).max(permissionCodes.length),
});
