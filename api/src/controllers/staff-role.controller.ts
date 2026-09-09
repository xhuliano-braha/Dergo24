import { NextRequest, NextResponse } from 'next/server';
import { rolePermissionsUpdateSchema } from '../lib/account-schemas';
import { getAuthenticatedStaff, unauthorizedResponse } from '../lib/staff-auth';
import { accessService } from '../services/access.service';
import { controllerErrorResponse } from './controller-response';
import { parseJson, type IdRouteContext } from './request-input';

export async function PATCH(request: NextRequest, context: IdRouteContext) {
  try {
    const actor = await getAuthenticatedStaff(request);
    if (!actor) return unauthorizedResponse();
    const { id } = await context.params;
    const roleId = Number(id);
    if (!Number.isSafeInteger(roleId) || roleId <= 0)
      return NextResponse.json(
        { error: 'Roli është i pavlefshëm.' },
        { status: 400 },
      );
    const input = await parseJson(
      request,
      rolePermissionsUpdateSchema,
      'Kontrolloni permission-et.',
    );
    return NextResponse.json(await accessService.update(roleId, input, actor));
  } catch (error) {
    return controllerErrorResponse(error, 'Role access update failed');
  }
}
