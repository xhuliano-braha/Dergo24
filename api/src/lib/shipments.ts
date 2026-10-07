import { z } from 'zod';

export const shipmentSchema = z.object({
  senderName: z.string().trim().min(2).max(80),
  senderPhone: z.string().trim().regex(/^\+?[0-9 \-.]{8,20}$/, 'Numër telefoni i pasaktë.'),
  recipientName: z.string().trim().min(2).max(80),
  recipientPhone: z.string().trim().regex(/^\+?[0-9 \-.]{8,20}$/, 'Numër telefoni i pasaktë.'),
  pickupCity: z.string().trim().min(2).max(60),
  deliveryCity: z.string().trim().min(2).max(60),
  address: z.string().trim().min(3).max(180),
  packageType: z.enum(['Dokumente', 'Pako', 'E brishtë', 'Tjetër']),
  weight: z.coerce.number().positive().max(100),
  service: z.enum(['standard', 'express']),
  codAmount: z.coerce.number().int().min(0).max(1000000).default(0),
  pickupDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  deliveryWindow: z.enum(['anytime', '09:00-13:00', '13:00-17:00', '17:00-20:00']).default('anytime').optional(),
  deliveryMethod: z.enum(['home', 'pickup_point']),
  pickupPointId: z.uuid().nullable().optional().or(z.literal('')).transform((v) => v || null),
}).refine((input) => {
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  return input.pickupDate >= yesterday;
}, {
  message: 'Data e marrjes nuk mund të jetë në të kaluarën.',
  path: ['pickupDate'],
});

export const bulkShipmentSchema = z.array(shipmentSchema).min(1).max(200);

export type ShipmentInput = z.infer<typeof shipmentSchema>;

function isTirana(city?: string) {
  if (!city) return false;
  return city
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase() === 'tirane';
}

export function calculatePrice(
  weight: number,
  service: ShipmentInput['service'],
  pickupCity?: string,
  deliveryCity?: string,
) {
  const isLocal = isTirana(pickupCity) && isTirana(deliveryCity);
  const base = isLocal ? 200 : 300;
  const extraWeight = Math.max(0, Math.ceil(weight) - 2) * 50;
  const expressSurcharge = service === 'express' ? 100 : 0;
  return base + extraWeight + expressSurcharge;
}

export function createTrackingCode() {
  const year = new Date().getFullYear().toString().slice(-2);
  const random = Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, '0')).join('').toUpperCase();
  return `D24-${year}-${random}`;
}
