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
    const { customer, session } = await accountService.loginCustomer(input);
    const response = NextResponse.json({ customer });
    setCustomerSession(response, session.access_token, session.expires_in);
    return response;
  } catch (error) {
    return controllerErrorResponse(error, 'Customer login failed');
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  clearCustomerSession(response);
  return response;
}
