import { z } from 'zod';

export const claimCreateSchema = z.object({
  shipmentId: z.uuid(),
  claimType: z.enum(['damaged', 'lost', 'delayed', 'other']),
  description: z.string().trim().min(10).max(1000),
  requestedRefund: z.number().int().min(0).max(1000000),
});
export const claimUpdateSchema = z.object({
  status: z.enum(['new', 'reviewing', 'approved', 'rejected', 'refunded']),
  approvedRefund: z.number().int().min(0).max(1000000).nullable(),
  staffNotes: z.string().trim().max(1000),
});
export const ratingSchema = z.object({
  shipmentId: z.uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(500),
});
export const pickupPointSchema = z.object({
  name: z.string().trim().min(2).max(100),
  city: z.string().trim().min(2).max(60),
  address: z.string().trim().min(5).max(180),
  openingHours: z.string().trim().min(3).max(120),
});
export const routePlanSchema = z.object({
  driverId: z.uuid(),
  pickupDate: z.iso.date(),
});
export const codSettlementSchema = z.object({ status: z.literal('settled') });
