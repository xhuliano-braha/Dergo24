import { NextRequest, NextResponse } from 'next/server';
import { accountService } from '../services/account.service';

export const STAFF_SESSION_COOKIE = 'dergo24_staff_session';

export type { StaffProfile } from '../types/profiles';

export async function getAuthenticatedStaff(request: NextRequest) {
  const accessToken = request.cookies.get(STAFF_SESSION_COOKIE)?.value;
  if (!accessToken) return null;

  return accountService.staffFromToken(accessToken);
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
