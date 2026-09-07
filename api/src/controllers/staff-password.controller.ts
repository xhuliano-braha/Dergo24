import { NextRequest, NextResponse } from 'next/server';
import { passwordChangeSchema } from '../lib/account-schemas';
import {
  clearStaffSession,
  getAuthenticatedStaff,
  unauthorizedResponse,
} from '../lib/staff-auth';
import { accountService } from '../services/account.service';
import { controllerErrorResponse } from './controller-response';
import { parseJson } from './request-input';

export async function POST(request: NextRequest) {
  try {
    const actor = await getAuthenticatedStaff(request);
    if (!actor) return unauthorizedResponse();
    const input = await parseJson(
      request,
      passwordChangeSchema,
      'Fjalëkalimi duhet të ketë të paktën 8 karaktere.',
    );
    const response = NextResponse.json(
      await accountService.changeOwnPassword(actor, input.newPassword, input.currentPassword),
    );
    clearStaffSession(response);
    return response;
  } catch (error) {
    return controllerErrorResponse(error, 'Staff password change failed');
  }
}
