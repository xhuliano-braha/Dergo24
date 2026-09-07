import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedStaff, unauthorizedResponse } from '../lib/staff-auth';
import { dashboardService } from '../services/dashboard.service';
import { controllerErrorResponse } from './controller-response';
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  try {
    const actor = await getAuthenticatedStaff(request);
    if (!actor) return unauthorizedResponse();
    return NextResponse.json(await dashboardService.staff(actor));
  } catch (error) {
    return controllerErrorResponse(error, 'Staff dashboard failed');
  }
}
