import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from './supabase-admin';

export const CUSTOMER_SESSION_COOKIE = 'dergo24_customer_session';

export type CustomerProfile = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
};

export async function getAuthenticatedCustomer(request: NextRequest) {
  const accessToken = request.cookies.get(CUSTOMER_SESSION_COOKIE)?.value;
  if (!accessToken) return null;

  const authClient = getSupabaseAdmin();
  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser(accessToken);
  if (userError || !user) return null;

  const { data: profile, error: profileError } = await getSupabaseAdmin()
    .from('customer_profiles')
    .select('id, full_name, email, phone, active')
    .eq('id', user.id)
    .eq('active', true)
    .maybeSingle();
  if (profileError || !profile) return null;

  return {
    id: profile.id,
    fullName: profile.full_name,
    email: profile.email,
    phone: profile.phone,
  } as CustomerProfile;
}

export function setCustomerSession(
  response: NextResponse,
  accessToken: string,
  expiresIn: number,
) {
  response.cookies.set(CUSTOMER_SESSION_COOKIE, accessToken, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: expiresIn,
  });
}

export function clearCustomerSession(response: NextResponse) {
  response.cookies.set(CUSTOMER_SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}

export function customerUnauthorizedResponse() {
  return NextResponse.json(
    { error: 'Sesioni ka skaduar. Hyni përsëri.' },
    { status: 401 },
  );
}
