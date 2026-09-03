import { NextRequest, NextResponse } from 'next/server';
import { bulkShipmentSchema, calculatePrice, createTrackingCode } from '@api/lib/shipments';
import { validateAlbanianAddress } from '@api/lib/albania-address';
import { getSupabaseAdmin } from '@api/lib/supabase-admin';
import { getAuthenticatedStaff, unauthorizedResponse } from '@api/lib/staff-auth';

export async function POST(request: NextRequest) {
  const staff = await getAuthenticatedStaff(request);
  if (!staff) return unauthorizedResponse();
  if (!['admin', 'dispatcher'].includes(staff.role))
    return NextResponse.json({ error: 'Nuk keni leje për import.' }, { status: 403 });
  const parsed = bulkShipmentSchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json({ error: 'CSV përmban të dhëna të pavlefshme.' }, { status: 400 });

  const now = new Date().toISOString();
  const shipments = [];
  const events = [];
  for (const input of parsed.data) {
    const checked = validateAlbanianAddress(input.deliveryCity, input.address);
    if (!checked.valid)
      return NextResponse.json({ error: `${input.recipientName}: ${checked.message}` }, { status: 400 });
    const id = crypto.randomUUID();
    const trackingCode = createTrackingCode();
    shipments.push({
      id,
      tracking_code: trackingCode,
      sender_name: input.senderName,
      sender_phone: input.senderPhone,
      recipient_name: input.recipientName,
      recipient_phone: input.recipientPhone,
      pickup_city: input.pickupCity,
      delivery_city: checked.city,
      delivery_address: checked.address,
      package_type: input.packageType,
      weight_kg: input.weight,
      service: input.service,
      status: 'Porosia u regjistrua',
      quoted_price_all: calculatePrice(input.weight, input.service),
      cod_amount_all: input.codAmount,
      cod_status: input.codAmount > 0 ? 'pending' : 'not_required',
      pickup_date: input.pickupDate,
      delivery_window: input.deliveryWindow,
      delivery_method: input.deliveryMethod,
      pickup_point_id: input.pickupPointId,
      address_validated: true,
      created_at: now,
      updated_at: now,
    });
    events.push({
      id: crypto.randomUUID(),
      shipment_id: id,
      status: 'Porosia u regjistrua',
      location: input.pickupCity,
      details: 'Dërgesa u importua nga paneli i biznesit.',
      created_by: staff.id,
      created_at: now,
    });
  }

  const supabase = getSupabaseAdmin();
  const { error: shipmentError } = await supabase.from('shipments').insert(shipments);
  if (shipmentError) return NextResponse.json({ error: 'Dërgesat nuk u importuan.' }, { status: 503 });
  const { error: eventError } = await supabase.from('tracking_events').insert(events);
  if (eventError) return NextResponse.json({ error: 'Dërgesat u ruajtën, por jo historiku.' }, { status: 503 });
  return NextResponse.json({ imported: shipments.length, trackingCodes: shipments.map((item) => item.tracking_code) });
}
