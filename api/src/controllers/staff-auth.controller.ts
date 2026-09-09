import { NextRequest, NextResponse } from 'next/server';
import {
  clearStaffSession,
  getAuthenticatedStaff,
  setStaffSession,
} from '../lib/staff-auth';
import { staffLoginSchema } from '../lib/staff-schemas';
import { accountService } from '../services/account.service';
import { controllerErrorResponse } from './controller-response';
import { parseJson } from './request-input';
import { requestClient } from '../security/auth-throttle';
import { revokeSession } from '../security/app-session';
import { STAFF_SESSION_COOKIE } from '../lib/staff-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const staff = await getAuthenticatedStaff(request);
    if (!staff)
      return NextResponse.json({ authenticated: false }, { status: 401 });
    return NextResponse.json({ authenticated: true, staff });
  } catch (error) {
    return controllerErrorResponse(error, 'Staff session failed');
  }
}

export async function POST(request: NextRequest) {
  try {
    const input = await parseJson(
      request,
      staffLoginSchema,
      'Kontrolloni përdoruesin dhe fjalëkalimin.',
    );
    const { staff, session } = await accountService.loginStaff(input, await requestClient(request));
    const response = NextResponse.json({ staff });
    setStaffSession(response, session.access_token, session.expires_in);
    return response;
  } catch (error) {
    return controllerErrorResponse(error, 'Staff login failed');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await revokeSession(request.cookies.get(STAFF_SESSION_COOKIE)?.value, 'staff');
    const response = NextResponse.json({ success: true });
    clearStaffSession(response);
    return response;
  } catch (error) {
    return controllerErrorResponse(error, 'Staff logout failed');
  }
}
