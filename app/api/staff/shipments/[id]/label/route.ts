import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import {
  getAuthenticatedStaff,
  unauthorizedResponse,
} from '@/lib/staff-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const staff = await getAuthenticatedStaff(request);
  if (!staff) return unauthorizedResponse();
  const { id } = await params;
  const supabase = getSupabaseAdmin();

  let query = supabase
    .from('shipments')
    .select('id, tracking_code, sender_name, sender_phone, recipient_name, recipient_phone, pickup_city, delivery_city, delivery_address, package_type, weight_kg, service, cod_amount_all, quoted_price_all, pickup_date, delivery_window, delivery_method, pickup_points(name, address), created_at')
    .eq('id', id);

  if (staff.role === 'courier') {
    const { data: driver } = await supabase
      .from('drivers')
      .select('id')
      .eq('staff_id', staff.id)
      .maybeSingle();
    query = query.eq('driver_id', driver?.id ?? crypto.randomUUID());
  }

  const { data, error } = await query.maybeSingle();
  if (error)
    return NextResponse.json({ error: 'Etiketa nuk mund të ngarkohej.' }, { status: 503 });
  if (!data)
    return NextResponse.json({ error: 'Dërgesa nuk u gjet.' }, { status: 404 });
  return NextResponse.json({ shipment: data });
}
