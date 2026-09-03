import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getAuthenticatedStaff } from '@/lib/staff-auth';

const pickupPointSchema = z.object({
  name: z.string().trim().min(2).max(100),
  city: z.string().trim().min(2).max(60),
  address: z.string().trim().min(5).max(180),
  openingHours: z.string().trim().min(3).max(120),
});

export async function GET() {
  const { data, error } = await getSupabaseAdmin()
    .from('pickup_points')
    .select('id, name, city, address, opening_hours')
    .eq('active', true)
    .order('city');
  if (error) return NextResponse.json({ error: 'Pikat nuk mund të ngarkoheshin.' }, { status: 503 });
  return NextResponse.json({ points: data ?? [] });
}

export async function POST(request: NextRequest) {
  const staff = await getAuthenticatedStaff(request);
  if (!staff || staff.role !== 'admin')
    return NextResponse.json({ error: 'Vetëm administratori mund të shtojë pika.' }, { status: 403 });
  const parsed = pickupPointSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Kontrolloni të dhënat e pikës.' }, { status: 400 });
  const { error } = await getSupabaseAdmin().from('pickup_points').insert({
    name: parsed.data.name,
    city: parsed.data.city,
    address: parsed.data.address,
    opening_hours: parsed.data.openingHours,
  });
  if (error) return NextResponse.json({ error: 'Pika nuk mund të ruhej.' }, { status: 503 });
  return NextResponse.json({ success: true }, { status: 201 });
}
