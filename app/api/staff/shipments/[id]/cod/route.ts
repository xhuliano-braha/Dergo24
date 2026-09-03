import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import {
  getAuthenticatedStaff,
  unauthorizedResponse,
} from '@/lib/staff-auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const staff = await getAuthenticatedStaff(request);
  if (!staff) return unauthorizedResponse();
  if (staff.role !== 'admin' && staff.role !== 'dispatcher')
    return NextResponse.json({ error: 'Vetëm administratori ose dispeçeri mund të mbyllë arkëtimet.' }, { status: 403 });
  let body: { status?: string };
  try {
    body = await request.json() as { status?: string };
  } catch {
    return NextResponse.json({ error: 'Kërkesa nuk është e vlefshme.' }, { status: 400 });
  }
  if (body.status !== 'settled')
    return NextResponse.json({ error: 'Status i pavlefshëm.' }, { status: 400 });
  const { id } = await params;
  const { data, error } = await getSupabaseAdmin()
    .from('shipments')
    .update({ cod_status: 'settled', updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('cod_status', 'collected')
    .select('id')
    .maybeSingle();
  if (error || !data)
    return NextResponse.json({ error: 'Arkëtimi nuk mund të mbyllej.' }, { status: 503 });
  return NextResponse.json({ success: true });
}
