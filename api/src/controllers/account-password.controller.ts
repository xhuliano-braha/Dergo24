import { NextRequest, NextResponse } from 'next/server';
import { passwordChangeSchema } from '../lib/account-schemas';
import {
  clearCustomerSession,
  getAuthenticatedCustomer,
  customerUnauthorizedResponse,
} from '../lib/customer-auth';
import { accountService } from '../services/account.service';
import { controllerErrorResponse } from './controller-response';
import { parseJson } from './request-input';
import { requestClient } from '../security/auth-throttle';

export async function POST(request: NextRequest) {
  try {
    const actor = await getAuthenticatedCustomer(request);
    if (!actor) return customerUnauthorizedResponse();
    const input = await parseJson(
      request,
      passwordChangeSchema,
      'Fjalëkalimi duhet të ketë të paktën 8 karaktere.',
    );
    const response = NextResponse.json(
      await accountService.changeOwnPassword(actor, input.newPassword, input.currentPassword, await requestClient(request)),
    );
    clearCustomerSession(response);
    return response;
  } catch (error) {
    return controllerErrorResponse(error, 'Customer password change failed');
  }
}
