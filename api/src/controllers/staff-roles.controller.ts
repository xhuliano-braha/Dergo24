import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedStaff, unauthorizedResponse } from '../lib/staff-auth';
import { accessService } from '../services/access.service';
import { controllerErrorResponse } from './controller-response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const actor = await getAuthenticatedStaff(request);
    if (!actor) return unauthorizedResponse();
    return NextResponse.json(await accessService.list(actor));
  } catch (error) {
    return controllerErrorResponse(error, 'Role access list failed');
  }
}
