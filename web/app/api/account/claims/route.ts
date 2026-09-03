import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedCustomer, customerUnauthorizedResponse } from '@api/lib/customer-auth';
import { getSupabaseAdmin } from '@api/lib/supabase-admin';

const schema = z.object({
  shipmentId: z.uuid(),
  claimType: z.enum(['damaged', 'lost', 'delayed', 'other']),
  description: z.string().trim().min(10).max(1000),
  requestedRefund: z.number().int().min(0).max(1000000),
});

export async function POST(request: NextRequest) {
  const customer = await getAuthenticatedCustomer(request);
  if (!customer) return customerUnauthorizedResponse();
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Kontrolloni kërkesën.' }, { status: 400 });
  const supabase = getSupabaseAdmin();
  const { data: shipment } = await supabase.from('shipments').select('id').eq('id', parsed.data.shipmentId).eq('customer_id', customer.id).maybeSingle();
  if (!shipment) return NextResponse.json({ error: 'Dërgesa nuk u gjet.' }, { status: 404 });
  const { error } = await supabase.from('claims').insert({
    shipment_id: shipment.id,
    customer_id: customer.id,
    claim_type: parsed.data.claimType,
    description: parsed.data.description,
    requested_refund_all: parsed.data.requestedRefund,
  });
  if (error) return NextResponse.json({ error: 'Kërkesa nuk mund të ruhej.' }, { status: 503 });
  return NextResponse.json({ success: true }, { status: 201 });
}
