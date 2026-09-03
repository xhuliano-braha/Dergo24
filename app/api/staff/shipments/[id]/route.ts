import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import {
  getAuthenticatedStaff,
  unauthorizedResponse,
} from '@/lib/staff-auth';
import { shipmentUpdateSchema } from '@/lib/staff-schemas';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const staff = await getAuthenticatedStaff(request);
  if (!staff) return unauthorizedResponse();

  const parsed = shipmentUpdateSchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: 'Kontrolloni statusin dhe shënimin.' },
      { status: 400 },
    );

  const { id } = await params;
  const supabase = getSupabaseAdmin();
  const { data: currentShipment } = await supabase
    .from('shipments')
    .select('driver_id, cod_status')
    .eq('id', id)
    .maybeSingle();
  if (!currentShipment)
    return NextResponse.json({ error: 'Dërgesa nuk u gjet.' }, { status: 404 });

  if (staff.role === 'courier') {
    const { data: driver } = await supabase
      .from('drivers')
      .select('id')
      .eq('staff_id', staff.id)
      .maybeSingle();
    if (!driver || currentShipment.driver_id !== driver.id)
      return NextResponse.json({ error: 'Nuk keni akses në këtë dërgesë.' }, { status: 403 });
    if (parsed.data.status === 'U dorëzua')
      return NextResponse.json({ error: 'Përdorni konfirmimin me firmë për dorëzimin.' }, { status: 400 });
  }

  const now = new Date().toISOString();
  const { data: shipment, error: shipmentError } = await supabase
    .from('shipments')
    .update({
      status: parsed.data.status,
      driver_id: staff.role === 'courier' ? currentShipment.driver_id : parsed.data.driverId,
      cod_status: staff.role === 'courier' ? currentShipment.cod_status : parsed.data.codStatus,
      updated_at: now,
    })
    .eq('id', id)
    .select('id')
    .maybeSingle();

  if (shipmentError || !shipment)
    return NextResponse.json(
      { error: 'Dërgesa nuk mund të përditësohej.' },
      { status: 503 },
    );

  const { error: eventError } = await supabase.from('tracking_events').insert({
    id: crypto.randomUUID(),
    shipment_id: id,
    status: parsed.data.status,
    location: parsed.data.location,
    details: parsed.data.details,
    latitude: parsed.data.latitude,
    longitude: parsed.data.longitude,
    created_by: staff.id,
    created_at: now,
  });

  if (eventError)
    return NextResponse.json(
      { error: 'Statusi u ruajt, por historiku nuk u regjistrua.' },
      { status: 503 },
    );

  return NextResponse.json({ success: true });
}
