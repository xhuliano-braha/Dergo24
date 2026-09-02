import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import {
  getAuthenticatedStaff,
  unauthorizedResponse,
} from '@/lib/staff-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const staff = await getAuthenticatedStaff(request);
  if (!staff) return unauthorizedResponse();

  const supabase = getSupabaseAdmin();
  const [shipmentsResult, quotesResult, driversResult] = await Promise.all([
    supabase
      .from('shipments')
      .select(
        'id, tracking_code, sender_name, sender_phone, recipient_name, recipient_phone, pickup_city, delivery_city, delivery_address, package_type, weight_kg, service, status, quoted_price_all, driver_id, created_at, drivers(full_name)',
      )
      .order('created_at', { ascending: false })
      .limit(200),
    supabase
      .from('quote_requests')
      .select(
        'id, reference_code, customer_name, phone, pickup_city, delivery_city, item_type, description, status, quoted_price_all, created_at',
      )
      .order('created_at', { ascending: false })
      .limit(200),
    supabase
      .from('drivers')
      .select('id, full_name, phone, status, active, created_at')
      .order('full_name'),
  ]);

  const error =
    shipmentsResult.error ?? quotesResult.error ?? driversResult.error;
  if (error)
    return NextResponse.json(
      { error: 'Të dhënat nuk mund të ngarkoheshin.' },
      { status: 503 },
    );

  return NextResponse.json({
    staff,
    shipments: shipmentsResult.data ?? [],
    quotes: quotesResult.data ?? [],
    drivers: driversResult.data ?? [],
  });
}
