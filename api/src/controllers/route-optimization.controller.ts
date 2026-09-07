import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedStaff, unauthorizedResponse } from '../lib/staff-auth';
import { deliveryService } from '../services/delivery.service';
import { controllerErrorResponse } from './controller-response';
import { parseJson } from './request-input';
import { routePlanSchema } from '../schemas/postal.schema';
export async function POST(request: NextRequest) {
  try {
    const staff = await getAuthenticatedStaff(request);
    if (!staff) return unauthorizedResponse();
    const input = await parseJson(
      request,
      routePlanSchema,
      'Kontrolloni të dhënat e kërkesës.',
    );
    return NextResponse.json(await deliveryService.optimize(input, staff));
  } catch (error) {
    return controllerErrorResponse(error, 'optimize failed');
  }
}
