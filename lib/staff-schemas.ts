import { z } from 'zod';

export const staffLoginSchema = z.object({
  login: z.string().trim().min(3).max(160),
  password: z.string().min(8).max(128),
});

export const shipmentUpdateSchema = z.object({
  status: z.enum([
    'Porosia u regjistrua',
    'Në pritje të marrjes',
    'U mor nga korrieri',
    'Në transport',
    'Në shpërndarje',
    'U dorëzua',
    'U anulua',
  ]),
  driverId: z.uuid().nullable(),
  location: z.string().trim().min(2).max(100),
  details: z.string().trim().min(3).max(300),
  latitude: z.number().min(-90).max(90).nullable(),
  longitude: z.number().min(-180).max(180).nullable(),
});

export const driverCreateSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  phone: z.string().trim().regex(/^\+?[0-9 ]{8,16}$/),
});

export const driverUpdateSchema = z.object({
  status: z.enum(['available', 'assigned', 'off_duty']),
  active: z.boolean(),
});

export const quoteUpdateSchema = z.object({
  status: z.enum(['new', 'contacted', 'quoted', 'accepted', 'declined']),
  quotedPrice: z.number().int().positive().nullable(),
});
