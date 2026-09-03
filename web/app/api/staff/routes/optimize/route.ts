import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@api/lib/supabase-admin';
import { getAuthenticatedStaff, unauthorizedResponse } from '@api/lib/staff-auth';

const schema = z.object({
  driverId: z.uuid(),
  pickupDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function POST(request: NextRequest) {
  const staff = await getAuthenticatedStaff(request);
  if (!staff) return unauthorizedResponse();
  if (!['admin', 'dispatcher'].includes(staff.role))
    return NextResponse.json({ error: 'Nuk keni leje për planifikim.' }, { status: 403 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Zgjidhni korrierin dhe datën.' }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('shipments')
    .select('id, tracking_code, delivery_city, delivery_address, delivery_window, service, created_at')
    .eq('driver_id', parsed.data.driverId)
    .eq('pickup_date', parsed.data.pickupDate)
    .not('status', 'in', '("U dorëzua","U anulua")');
  if (error) return NextResponse.json({ error: 'Dërgesat nuk mund të planifikoheshin.' }, { status: 503 });

  const windowOrder = { '09:00-13:00': 0, '13:00-17:00': 1, '17:00-20:00': 2, anytime: 3 } as const;
  const ordered = [...(data ?? [])].sort((first, second) =>
    windowOrder[first.delivery_window as keyof typeof windowOrder] - windowOrder[second.delivery_window as keyof typeof windowOrder] ||
    Number(second.service === 'express') - Number(first.service === 'express') ||
    first.delivery_city.localeCompare(second.delivery_city, 'sq') ||
    first.delivery_address.localeCompare(second.delivery_address, 'sq') ||
    +new Date(first.created_at) - +new Date(second.created_at),
  );
  const results = await Promise.all(ordered.map((shipment, index) =>
    supabase.from('shipments').update({ route_order: index + 1 }).eq('id', shipment.id),
  ));
  if (results.some((result) => result.error))
    return NextResponse.json({ error: 'Rruga nuk u ruajt plotësisht.' }, { status: 503 });
  return NextResponse.json({ stops: ordered.map((shipment, index) => ({ ...shipment, routeOrder: index + 1 })) });
}
