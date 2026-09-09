import { z } from 'zod';
import { normalizeSignature } from '../security/image-validation';

export const deliveryProofSchema = z.object({
  recipientName: z.string().trim().min(2).max(80),
  signatureData: z.string().max(500000).transform((value, context) => {
    try { return normalizeSignature(value); } catch {
      context.addIssue({ code: 'custom', message: 'Firma është e pavlefshme ose bosh.' });
      return z.NEVER;
    }
  }),
  notes: z.string().trim().max(1000),
  latitude: z.number().min(-90).max(90).nullable(),
  longitude: z.number().min(-180).max(180).nullable(),
  codCollected: z.number().int().min(0).max(1000000),
});

export type DeliveryProofInput = z.output<typeof deliveryProofSchema> & {
  photo: File | null;
};
