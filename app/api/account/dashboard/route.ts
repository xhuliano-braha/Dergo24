import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import {
  customerUnauthorizedResponse,
  getAuthenticatedCustomer,
} from '@/lib/customer-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const customer = await getAuthenticatedCustomer(request);
  if (!customer) return customerUnauthorizedResponse();

  const { data, error } = await getSupabaseAdmin()
    .from('shipments')
    .select(
      'id, tracking_code, recipient_name, pickup_city, delivery_city, delivery_address, package_type, weight_kg, service, status, quoted_price_all, created_at, tracking_events(status, location, details, created_at)',
    )
    .eq('customer_id', customer.id)
    .order('created_at', { ascending: false });
  if (error)
    return NextResponse.json(
      { error: 'Dërgesat nuk mund të ngarkoheshin.' },
      { status: 503 },
    );

  return NextResponse.json({ customer, shipments: data ?? [] });
}
