import { env } from 'cloudflare:workers';
import { NextRequest, NextResponse } from 'next/server';
import { calculatePrice, createTrackingCode, shipmentSchema } from '@/lib/shipments';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const trackingCode = request.nextUrl.searchParams.get('tracking')?.trim().toUpperCase();
  if (!trackingCode) return NextResponse.json({ error: 'Vendosni kodin e gjurmimit.' }, { status: 400 });

  const shipment = await env.DB.prepare(
    `SELECT tracking_code AS trackingCode, recipient_name AS recipientName,
      pickup_city AS pickupCity, delivery_city AS deliveryCity, status, service,
      created_at AS createdAt FROM shipments WHERE tracking_code = ?`,
  ).bind(trackingCode).first();

  if (!shipment) return NextResponse.json({ error: 'Nuk u gjet asnjë dërgesë me këtë kod.' }, { status: 404 });

  const events = await env.DB.prepare(
    `SELECT status, location, details, created_at AS createdAt FROM tracking_events
     WHERE shipment_id = (SELECT id FROM shipments WHERE tracking_code = ?)
     ORDER BY created_at DESC`,
  ).bind(trackingCode).all();

  return NextResponse.json({ shipment, events: events.results });
}

export async function POST(request: NextRequest) {
  const parsed = shipmentSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Kontrolloni të dhënat e formularit dhe provoni përsëri.' }, { status: 400 });
  }

  const input = parsed.data;
  const shipmentId = crypto.randomUUID();
  const trackingCode = createTrackingCode();
  const createdAt = new Date().toISOString();
  const status = 'Porosia u regjistrua';
  const price = calculatePrice(input.weight, input.service);

  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO shipments (id, tracking_code, sender_name, sender_phone, recipient_name,
       recipient_phone, pickup_city, delivery_city, address, package_type, weight, service,
       status, price, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(shipmentId, trackingCode, input.senderName, input.senderPhone, input.recipientName,
      input.recipientPhone, input.pickupCity, input.deliveryCity, input.address, input.packageType,
      input.weight, input.service, status, price, createdAt),
    env.DB.prepare(
      `INSERT INTO tracking_events (id, shipment_id, status, location, details, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).bind(crypto.randomUUID(), shipmentId, status, input.pickupCity,
      'Kërkesa u pranua. Korrieri do t’ju kontaktojë për marrjen e pakos.', createdAt),
  ]);

  return NextResponse.json({ trackingCode, price, status, createdAt }, { status: 201 });
}
