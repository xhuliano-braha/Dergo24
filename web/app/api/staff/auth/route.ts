import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@api/lib/supabase-admin';
import {
  clearStaffSession,
  getAuthenticatedStaff,
  setStaffSession,
} from '@api/lib/staff-auth';
import { staffLoginSchema } from '@api/lib/staff-schemas';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const staff = await getAuthenticatedStaff(request);
  if (!staff)
    return NextResponse.json({ authenticated: false }, { status: 401 });
  return NextResponse.json({ authenticated: true, staff });
}

export async function POST(request: NextRequest) {
  const parsed = staffLoginSchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: 'Kontrolloni përdoruesin dhe fjalëkalimin.' },
      { status: 400 },
    );

  const supabase = getSupabaseAdmin();
  const email = parsed.data.login.includes('@')
    ? parsed.data.login.toLowerCase()
    : `${parsed.data.login.toLowerCase()}@staff.dergo24.al`;
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: parsed.data.password,
  });
  if (error || !data.session || !data.user)
    return NextResponse.json(
      { error: 'Përdorues ose fjalëkalim i pasaktë.' },
      { status: 401 },
    );

  const { data: profile } = await getSupabaseAdmin()
    .from('staff_profiles')
    .select('id, full_name, email, role, active')
    .eq('id', data.user.id)
    .eq('active', true)
    .maybeSingle();

  if (!profile)
    return NextResponse.json(
      { error: 'Kjo llogari nuk ka akses te paneli.' },
      { status: 403 },
    );

  const response = NextResponse.json({
    staff: {
      id: profile.id,
      fullName: profile.full_name,
      email: profile.email,
      role: profile.role,
    },
  });
  setStaffSession(response, data.session.access_token, data.session.expires_in);
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  clearStaffSession(response);
  return response;
}
