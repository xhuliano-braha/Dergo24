import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedCustomer, customerUnauthorizedResponse } from '@/lib/customer-auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

const schema = z.object({
  shipmentId: z.uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(500),
});

export async function POST(request: NextRequest) {
  const customer = await getAuthenticatedCustomer(request);
  if (!customer) return customerUnauthorizedResponse();
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Vlerësimi nuk është i vlefshëm.' }, { status: 400 });
  const supabase = getSupabaseAdmin();
  const { data: shipment } = await supabase
    .from('shipments')
    .select('id, driver_id, status')
    .eq('id', parsed.data.shipmentId)
    .eq('customer_id', customer.id)
    .maybeSingle();
  if (!shipment || shipment.status !== 'U dorëzua' || !shipment.driver_id)
    return NextResponse.json({ error: 'Mund të vlerësoni vetëm një dërgesë të përfunduar.' }, { status: 400 });
  const { error } = await supabase.from('delivery_ratings').upsert({
    shipment_id: shipment.id,
    customer_id: customer.id,
    driver_id: shipment.driver_id,
    rating: parsed.data.rating,
    comment: parsed.data.comment || null,
  }, { onConflict: 'shipment_id' });
  if (error) return NextResponse.json({ error: 'Vlerësimi nuk mund të ruhej.' }, { status: 503 });
  return NextResponse.json({ success: true });
}
