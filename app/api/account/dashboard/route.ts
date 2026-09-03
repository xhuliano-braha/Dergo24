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
      'id, tracking_code, recipient_name, pickup_city, delivery_city, delivery_address, package_type, weight_kg, service, status, quoted_price_all, cod_amount_all, cod_status, pickup_date, delivery_window, delivery_method, pickup_points(name, address, opening_hours), created_at, tracking_events(status, location, details, latitude, longitude, created_at), delivery_proofs(recipient_name, delivered_at, cod_collected_all), claims(id, claim_type, description, requested_refund_all, approved_refund_all, status, staff_notes, created_at), delivery_ratings(rating, comment)',
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
