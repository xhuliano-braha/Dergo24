import { z } from 'zod';
import { validSignature } from '../security/image-validation';

export const deliveryProofSchema = z.object({
  recipientName: z.string().trim().min(2).max(80),
  signatureData: z.string().max(500000).refine(validSignature),
  notes: z.string().trim().max(1000),
  latitude: z.number().min(-90).max(90).nullable(),
  longitude: z.number().min(-180).max(180).nullable(),
  codCollected: z.number().int().min(0).max(1000000),
});

export type DeliveryProofInput = z.output<typeof deliveryProofSchema> & {
  photo: File | null;
};
