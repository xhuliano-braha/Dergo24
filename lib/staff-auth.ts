import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const STAFF_SESSION_COOKIE = 'dergo24_staff_session';

export type StaffProfile = {
  id: string;
  fullName: string;
  email: string;
  role: 'admin' | 'dispatcher' | 'support' | 'courier';
};

export async function getAuthenticatedStaff(request: NextRequest) {
  const accessToken = request.cookies.get(STAFF_SESSION_COOKIE)?.value;
  if (!accessToken) return null;

  const authClient = getSupabaseAdmin();
  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser(accessToken);
  if (userError || !user) return null;

  const { data: profile, error: profileError } = await getSupabaseAdmin()
    .from('staff_profiles')
    .select('id, full_name, email, role, active')
    .eq('id', user.id)
    .eq('active', true)
    .maybeSingle();

  if (profileError || !profile) return null;

  return {
    id: profile.id,
    fullName: profile.full_name,
    email: profile.email,
    role: profile.role,
  } as StaffProfile;
}

export function setStaffSession(
  response: NextResponse,
  accessToken: string,
  expiresIn: number,
) {
  response.cookies.set(STAFF_SESSION_COOKIE, accessToken, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: expiresIn,
  });
}

export function clearStaffSession(response: NextResponse) {
  response.cookies.set(STAFF_SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}

export function unauthorizedResponse() {
  return NextResponse.json(
    { error: 'Sesioni ka skaduar. Hyni përsëri.' },
    { status: 401 },
  );
}
