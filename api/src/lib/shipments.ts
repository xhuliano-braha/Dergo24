import { z } from 'zod';

export const shipmentSchema = z.object({
  senderName: z.string().trim().min(2).max(80),
  senderPhone: z.string().trim().regex(/^\+?[0-9 ]{8,16}$/),
  recipientName: z.string().trim().min(2).max(80),
  recipientPhone: z.string().trim().regex(/^\+?[0-9 ]{8,16}$/),
  pickupCity: z.string().trim().min(2).max(60),
  deliveryCity: z.string().trim().min(2).max(60),
  address: z.string().trim().min(5).max(180),
  packageType: z.enum(['Dokumente', 'Pako', 'E brishtë', 'Tjetër']),
  weight: z.coerce.number().positive().max(100),
  service: z.enum(['standard', 'express']),
  codAmount: z.coerce.number().int().min(0).max(1000000).default(0),
  pickupDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  deliveryWindow: z.enum(['anytime', '09:00-13:00', '13:00-17:00', '17:00-20:00']),
  deliveryMethod: z.enum(['home', 'pickup_point']),
  pickupPointId: z.uuid().nullable(),
}).refine((input) => input.pickupDate >= new Date().toISOString().slice(0, 10), {
  message: 'Data e marrjes nuk mund të jetë në të kaluarën.',
  path: ['pickupDate'],
});

export const bulkShipmentSchema = z.array(shipmentSchema).min(1).max(200);

export type ShipmentInput = z.infer<typeof shipmentSchema>;

export function calculatePrice(weight: number, service: ShipmentInput['service']) {
  return (service === 'express' ? 800 : 500) + Math.max(0, Math.ceil(weight) - 1) * 100;
}

export function createTrackingCode() {
  const year = new Date().getFullYear().toString().slice(-2);
  const random = crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
  return `D24-${year}-${random}`;
}
