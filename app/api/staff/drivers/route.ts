import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import {
  getAuthenticatedStaff,
  unauthorizedResponse,
} from '@/lib/staff-auth';
import { driverCreateSchema } from '@/lib/staff-schemas';

export async function POST(request: NextRequest) {
  const staff = await getAuthenticatedStaff(request);
  if (!staff) return unauthorizedResponse();
  if (staff.role !== 'admin' && staff.role !== 'dispatcher')
    return NextResponse.json({ error: 'Nuk keni leje për këtë veprim.' }, { status: 403 });

  const parsed = driverCreateSchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: 'Kontrolloni emrin dhe telefonin.' },
      { status: 400 },
    );

  const { error } = await getSupabaseAdmin().from('drivers').insert({
    full_name: parsed.data.fullName,
    phone: parsed.data.phone,
  });
  if (error)
    return NextResponse.json(
      { error: 'Korrieri nuk mund të ruhej. Telefoni mund të jetë në përdorim.' },
      { status: 409 },
    );
  return NextResponse.json({ success: true }, { status: 201 });
}
