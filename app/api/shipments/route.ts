import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import {
  calculatePrice,
  createTrackingCode,
  shipmentSchema,
} from '@/lib/shipments';
import { getAuthenticatedCustomer } from '@/lib/customer-auth';
import { validateAlbanianAddress } from '@/lib/albania-address';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const trackingCode = request.nextUrl.searchParams
    .get('tracking')
    ?.trim()
    .toUpperCase();
  if (!trackingCode)
    return NextResponse.json(
      { error: 'Vendosni kodin e gjurmimit.' },
      { status: 400 },
    );

  try {
    const supabase = getSupabaseAdmin();
    const { data: shipment, error: shipmentError } = await supabase
      .from('shipments')
      .select(
        'id, tracking_code, pickup_city, delivery_city, status, service, created_at',
      )
      .eq('tracking_code', trackingCode)
      .maybeSingle();

    if (shipmentError) throw shipmentError;
    if (!shipment)
      return NextResponse.json(
        { error: 'Nuk u gjet asnjë dërgesë me këtë kod.' },
        { status: 404 },
      );

    const { data: events, error: eventsError } = await supabase
      .from('tracking_events')
      .select('status, location, details, latitude, longitude, created_at')
      .eq('shipment_id', shipment.id)
      .order('created_at', { ascending: false });

    if (eventsError) throw eventsError;

    return NextResponse.json({
      shipment: {
        trackingCode: shipment.tracking_code,
        pickupCity: shipment.pickup_city,
        deliveryCity: shipment.delivery_city,
        status: shipment.status,
        service: shipment.service,
        createdAt: shipment.created_at,
      },
      events: (events ?? []).map((event) => ({
        status: event.status,
        location: event.location,
        details: event.details,
        latitude: event.latitude,
        longitude: event.longitude,
        createdAt: event.created_at,
      })),
    });
  } catch (error) {
    console.error('Shipment tracking failed', error);
    return NextResponse.json(
      { error: 'Shërbimi i gjurmimit nuk është përkohësisht i disponueshëm.' },
      { status: 503 },
    );
  }
}

export async function POST(request: NextRequest) {
  const parsed = shipmentSchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: 'Kontrolloni të dhënat e formularit dhe provoni përsëri.' },
      { status: 400 },
    );

  try {
    const supabase = getSupabaseAdmin();
    const customer = await getAuthenticatedCustomer(request);
    const input = parsed.data;
    const addressCheck = validateAlbanianAddress(input.deliveryCity, input.address);
    if (!addressCheck.valid)
      return NextResponse.json({ error: addressCheck.message }, { status: 400 });
    if (input.deliveryMethod === 'pickup_point' && !input.pickupPointId)
      return NextResponse.json({ error: 'Zgjidhni pikën e tërheqjes.' }, { status: 400 });
    const shipmentId = crypto.randomUUID();
    const trackingCode = createTrackingCode();
    const createdAt = new Date().toISOString();
    const status = 'Porosia u regjistrua';
    const price = calculatePrice(input.weight, input.service);

    const { error: shipmentError } = await supabase.from('shipments').insert({
      id: shipmentId,
      tracking_code: trackingCode,
      sender_name: input.senderName,
      sender_phone: input.senderPhone,
      recipient_name: input.recipientName,
      recipient_phone: input.recipientPhone,
      pickup_city: input.pickupCity,
      delivery_city: addressCheck.city,
      delivery_address: addressCheck.address,
      package_type: input.packageType,
      weight_kg: input.weight,
      service: input.service,
      status,
      customer_id: customer?.id ?? null,
      quoted_price_all: price,
      cod_amount_all: input.codAmount,
      cod_status: input.codAmount > 0 ? 'pending' : 'not_required',
      pickup_date: input.pickupDate,
      delivery_window: input.deliveryWindow,
      delivery_method: input.deliveryMethod,
      pickup_point_id: input.pickupPointId,
      address_validated: true,
      created_at: createdAt,
      updated_at: createdAt,
    });
    if (shipmentError) throw shipmentError;

    const { error: eventError } = await supabase
      .from('tracking_events')
      .insert({
        id: crypto.randomUUID(),
        shipment_id: shipmentId,
        status,
        location: input.pickupCity,
        details:
          'Kërkesa u pranua. Korrieri do t’ju kontaktojë për marrjen e dërgesës.',
        created_at: createdAt,
      });
    if (eventError) throw eventError;

    return NextResponse.json(
      { trackingCode, price, status, createdAt },
      { status: 201 },
    );
  } catch (error) {
    console.error('Shipment booking failed', error);
    return NextResponse.json(
      { error: 'Rezervimi nuk mund të ruhej. Provoni përsëri.' },
      { status: 503 },
    );
  }
}
