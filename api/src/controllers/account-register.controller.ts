import { NextRequest, NextResponse } from 'next/server';
import { customerRegisterSchema } from '../lib/account-schemas';
import { setCustomerSession } from '../lib/customer-auth';
import { accountService } from '../services/account.service';
import { controllerErrorResponse } from './controller-response';
import { parseJson } from './request-input';

export async function POST(request: NextRequest) {
  try {
    const input = await parseJson(
      request,
      customerRegisterSchema,
      'Kontrolloni emrin, telefonin, email-in dhe fjalëkalimin.',
    );
    const { customer, session } = await accountService.registerCustomer(input);
    if (!session)
      return NextResponse.json(
        { error: 'Llogaria u krijua. Ju lutemi hyni.' },
        { status: 201 },
      );
    const response = NextResponse.json({ customer }, { status: 201 });
    setCustomerSession(response, session.access_token, session.expires_in);
    return response;
  } catch (error) {
    return controllerErrorResponse(error, 'Customer registration failed');
  }
}
