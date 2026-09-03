import { NextRequest, NextResponse } from 'next/server';
import { staffAccountUpdateSchema } from '@api/lib/account-schemas';
import { getSupabaseAdmin } from '@api/lib/supabase-admin';
import {
  getAuthenticatedStaff,
  unauthorizedResponse,
} from '@api/lib/staff-auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const staff = await getAuthenticatedStaff(request);
  if (!staff) return unauthorizedResponse();
  if (staff.role !== 'admin')
    return NextResponse.json(
      { error: 'Vetëm administratori mund të ndryshojë stafin.' },
      { status: 403 },
    );

  const parsed = staffAccountUpdateSchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: 'Kontrolloni rolin dhe fjalëkalimin.' },
      { status: 400 },
    );

  const { id } = await params;
  if (id === staff.id && (!parsed.data.active || parsed.data.role !== 'admin'))
    return NextResponse.json(
      { error: 'Nuk mund të hiqni aksesin tuaj administrativ.' },
      { status: 400 },
    );

  const { error: profileError } = await getSupabaseAdmin()
    .from('staff_profiles')
    .update({ role: parsed.data.role, active: parsed.data.active })
    .eq('id', id);
  if (profileError)
    return NextResponse.json(
      { error: 'Llogaria nuk mund të përditësohej.' },
      { status: 503 },
    );

  if (parsed.data.newPassword) {
    const { error: passwordError } =
      await getSupabaseAdmin().auth.admin.updateUserById(id, {
        password: parsed.data.newPassword,
      });
    if (passwordError)
      return NextResponse.json(
        { error: 'Roli u ruajt, por fjalëkalimi nuk u ndryshua.' },
        { status: 503 },
      );
  }
  return NextResponse.json({ success: true });
}
