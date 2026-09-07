import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedStaff, unauthorizedResponse } from '../lib/staff-auth';
import { deliveryService } from '../services/delivery.service';
import { controllerErrorResponse } from './controller-response';
import { parseId, type IdRouteContext } from './request-input';

export async function GET(request: NextRequest, context: IdRouteContext) {
  try {
    const staff = await getAuthenticatedStaff(request);
    if (!staff) return unauthorizedResponse();

    return NextResponse.json(
      await deliveryService.label(await parseId(context), staff),
    );
  } catch (error) {
    return controllerErrorResponse(error, 'label failed');
  }
}
