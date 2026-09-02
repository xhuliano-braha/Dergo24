import { z } from 'zod';

export const quoteRequestSchema = z.object({
  customerName: z.string().trim().min(2).max(80),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ]{8,16}$/),
  pickupCity: z.string().trim().min(2).max(60),
  deliveryCity: z.string().trim().min(2).max(60),
  itemType: z.enum([
    'Mobilje',
    'Elektroshtëpiake',
    'Paletë',
    'Ngarkesë biznesi',
    'Tjetër',
  ]),
  description: z.string().trim().min(10).max(800),
});
