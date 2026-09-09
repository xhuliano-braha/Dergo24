import { NextRequest, NextResponse } from 'next/server';
import {
  clearCustomerSession,
  getAuthenticatedCustomer,
  setCustomerSession,
} from '../lib/customer-auth';
import { customerLoginSchema } from '../lib/account-schemas';
import { accountService } from '../services/account.service';
import { controllerErrorResponse } from './controller-response';
import { parseJson } from './request-input';
import { requestClient } from '../security/auth-throttle';
import { revokeSession } from '../security/app-session';
import { CUSTOMER_SESSION_COOKIE } from '../lib/customer-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const customer = await getAuthenticatedCustomer(request);
    if (!customer)
      return NextResponse.json({ authenticated: false }, { status: 401 });
    return NextResponse.json({ authenticated: true, customer });
  } catch (error) {
    return controllerErrorResponse(error, 'Customer session failed');
  }
}

export async function POST(request: NextRequest) {
  try {
    const input = await parseJson(
      request,
      customerLoginSchema,
      'Kontrolloni email-in dhe fjalëkalimin.',
    );
    const { customer, session } = await accountService.loginCustomer(input, await requestClient(request));
    const response = NextResponse.json({ customer });
    setCustomerSession(response, session.access_token, session.expires_in);
    return response;
  } catch (error) {
    return controllerErrorResponse(error, 'Customer login failed');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await revokeSession(request.cookies.get(CUSTOMER_SESSION_COOKIE)?.value, 'customer');
    const response = NextResponse.json({ success: true });
    clearCustomerSession(response);
    return response;
  } catch (error) {
    return controllerErrorResponse(error, 'Customer logout failed');
  }
}
