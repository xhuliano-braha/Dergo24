import { NextRequest, NextResponse } from 'next/server';
import { staffAccountUpdateSchema } from '../lib/account-schemas';
import { getAuthenticatedStaff, unauthorizedResponse } from '../lib/staff-auth';
import { accountService } from '../services/account.service';
import { controllerErrorResponse } from './controller-response';
import { parseJson, parseId, type IdRouteContext } from './request-input';
import { hasPermission } from '../auth/permissions';

export async function PATCH(request: NextRequest, context: IdRouteContext) {
  try {
    const staff = await getAuthenticatedStaff(request);
    if (!staff) return unauthorizedResponse();
    if (!hasPermission(staff, 'staff.manage'))
      return NextResponse.json(
        { error: 'Vetëm administratori mund të ndryshojë stafin.' },
        { status: 403 },
      );
    const input = await parseJson(
      request,
      staffAccountUpdateSchema,
      'Kontrolloni të dhënat e llogarisë.',
    );
    return NextResponse.json(
      await accountService.updateStaff(await parseId(context), input, staff),
      { status: 200 },
    );
  } catch (error) {
    return controllerErrorResponse(error, 'Staff account update failed');
  }
}
