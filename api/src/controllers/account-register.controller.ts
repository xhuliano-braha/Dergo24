import { NextRequest, NextResponse } from 'next/server';
import { customerRegisterSchema } from '../lib/account-schemas';
import { requestClient } from '../security/auth-throttle';
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
    return NextResponse.json(await accountService.registerCustomer(input, await requestClient(request)), { status: 202 });
  } catch (error) {
    return controllerErrorResponse(error, 'Customer registration failed');
  }
}
