import { NextRequest, NextResponse } from 'next/server';
import { staffAccountCreateSchema } from '@api/lib/account-schemas';
import { getSupabaseAdmin } from '@api/lib/supabase-admin';
import {
  getAuthenticatedStaff,
  unauthorizedResponse,
} from '@api/lib/staff-auth';

export async function POST(request: NextRequest) {
  const staff = await getAuthenticatedStaff(request);
  if (!staff) return unauthorizedResponse();
  if (staff.role !== 'admin')
    return NextResponse.json(
      { error: 'Vetëm administratori mund të krijojë staf.' },
      { status: 403 },
    );

  const parsed = staffAccountCreateSchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: 'Kontrolloni emrin, përdoruesin, rolin dhe fjalëkalimin.' },
      { status: 400 },
    );

  const email = parsed.data.login.includes('@')
    ? parsed.data.login.toLowerCase()
    : `${parsed.data.login.toLowerCase()}@staff.dergo24.al`;
  const admin = getSupabaseAdmin();
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: { full_name: parsed.data.fullName },
  });
  if (createError || !created.user)
    return NextResponse.json(
      { error: 'Ky përdorues mund të ekzistojë.' },
      { status: 409 },
    );

  const { error: profileError } = await getSupabaseAdmin()
    .from('staff_profiles')
    .insert({
      id: created.user.id,
      full_name: parsed.data.fullName,
      email,
      role: parsed.data.role,
      active: true,
    });
  if (profileError) {
    await admin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json(
      { error: 'Llogaria e stafit nuk mund të krijohej.' },
      { status: 503 },
    );
  }
  return NextResponse.json({ success: true }, { status: 201 });
}
