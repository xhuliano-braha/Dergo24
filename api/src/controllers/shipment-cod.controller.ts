import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedStaff, unauthorizedResponse } from '../lib/staff-auth';
import { deliveryService } from '../services/delivery.service';
import { controllerErrorResponse } from './controller-response';
import { parseId, type IdRouteContext, parseJson } from './request-input';
import { codSettlementSchema } from '../schemas/postal.schema';
export async function PATCH(request: NextRequest, context: IdRouteContext) {
  try {
    const staff = await getAuthenticatedStaff(request);
    if (!staff) return unauthorizedResponse();
    await parseJson(
      request,
      codSettlementSchema,
      'Kontrolloni të dhënat e kërkesës.',
    );
    return NextResponse.json(
      await deliveryService.settle(await parseId(context), staff),
    );
  } catch (error) {
    return controllerErrorResponse(error, 'settle failed');
  }
}
