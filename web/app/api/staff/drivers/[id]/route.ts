import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@api/lib/supabase-admin';
import {
  getAuthenticatedStaff,
  unauthorizedResponse,
} from '@api/lib/staff-auth';
import { driverUpdateSchema } from '@api/lib/staff-schemas';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const staff = await getAuthenticatedStaff(request);
  if (!staff) return unauthorizedResponse();
  if (staff.role !== 'admin' && staff.role !== 'dispatcher')
    return NextResponse.json({ error: 'Nuk keni leje për këtë veprim.' }, { status: 403 });

  const parsed = driverUpdateSchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json({ error: 'Status i pavlefshëm.' }, { status: 400 });

  const { id } = await params;
  const { error } = await getSupabaseAdmin()
    .from('drivers')
    .update({
      status: parsed.data.status,
      active: parsed.data.active,
      staff_id: parsed.data.staffId,
    })
    .eq('id', id);
  if (error)
    return NextResponse.json(
      { error: 'Korrieri nuk mund të përditësohej.' },
      { status: 503 },
    );
  return NextResponse.json({ success: true });
}
