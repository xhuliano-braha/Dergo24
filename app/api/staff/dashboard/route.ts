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
  let shipmentsQuery = supabase
      .from('shipments')
      .select(
        'id, tracking_code, sender_name, sender_phone, recipient_name, recipient_phone, pickup_city, delivery_city, delivery_address, package_type, weight_kg, service, status, quoted_price_all, cod_amount_all, cod_status, driver_id, pickup_date, delivery_window, delivery_method, pickup_point_id, address_validated, route_order, created_at, drivers(full_name), pickup_points(name, address), delivery_proofs(recipient_name, delivered_at, cod_collected_all)',
      )
      .order('created_at', { ascending: false })
      .limit(200);

  if (staff.role === 'courier') {
    const { data: driver } = await supabase
      .from('drivers')
      .select('id')
      .eq('staff_id', staff.id)
      .maybeSingle();
    shipmentsQuery = shipmentsQuery.eq('driver_id', driver?.id ?? crypto.randomUUID());
  }

  const [shipmentsResult, quotesResult, driversResult, staffResult, claimsResult, ratingsResult, pointsResult] = await Promise.all([
    shipmentsQuery,
    supabase
      .from('quote_requests')
      .select(
        'id, reference_code, customer_name, phone, pickup_city, delivery_city, item_type, description, status, quoted_price_all, created_at',
      )
      .order('created_at', { ascending: false })
      .limit(200),
    supabase
      .from('drivers')
      .select('id, full_name, phone, status, active, staff_id, created_at')
      .order('full_name'),
    supabase
      .from('staff_profiles')
      .select('id, full_name, email, role, active, created_at')
      .order('full_name'),
    supabase
      .from('claims')
      .select('id, shipment_id, claim_type, description, requested_refund_all, approved_refund_all, status, staff_notes, created_at, shipments(tracking_code, recipient_name)')
      .order('created_at', { ascending: false }),
    supabase
      .from('delivery_ratings')
      .select('id, driver_id, rating, comment, created_at, drivers(full_name), shipments(tracking_code)')
      .order('created_at', { ascending: false }),
    supabase
      .from('pickup_points')
      .select('id, name, city, address, opening_hours, active')
      .order('city'),
  ]);

  const error =
    shipmentsResult.error ??
    quotesResult.error ??
    driversResult.error ??
    staffResult.error ??
    claimsResult.error ??
    ratingsResult.error ??
    pointsResult.error;
  if (error)
    return NextResponse.json(
      { error: 'Të dhënat nuk mund të ngarkoheshin.' },
      { status: 503 },
    );

  return NextResponse.json({
    staff,
    shipments: shipmentsResult.data ?? [],
    quotes: staff.role === 'courier' ? [] : quotesResult.data ?? [],
    drivers: staff.role === 'courier' ? (driversResult.data ?? []).filter((driver) => driver.staff_id === staff.id) : driversResult.data ?? [],
    staffAccounts: staff.role === 'courier' ? [] : staffResult.data ?? [],
    claims: staff.role === 'courier' ? [] : claimsResult.data ?? [],
    ratings: staff.role === 'courier' ? [] : ratingsResult.data ?? [],
    pickupPoints: pointsResult.data ?? [],
  });
}
