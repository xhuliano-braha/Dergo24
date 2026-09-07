import { NextRequest, NextResponse } from 'next/server';
import { accountService } from '../services/account.service';

export const CUSTOMER_SESSION_COOKIE = 'dergo24_customer_session';

export type { CustomerProfile } from '../types/profiles';

export async function getAuthenticatedCustomer(request: NextRequest) {
  const accessToken = request.cookies.get(CUSTOMER_SESSION_COOKIE)?.value;
  if (!accessToken) return null;

  return accountService.customerFromToken(accessToken);
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
