import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedStaff, unauthorizedResponse } from '../lib/staff-auth';
import { pickupPointSchema } from '../schemas/postal.schema';
import { postalService } from '../services/postal.service';
import { controllerErrorResponse } from './controller-response';
import { parseJson } from './request-input';

export async function POST(request: NextRequest) {
  try {
    const actor = await getAuthenticatedStaff(request);
    if (!actor) return unauthorizedResponse();
    const input = await parseJson(
      request,
      pickupPointSchema,
      'Kontrolloni të dhënat e kërkesës.',
    );
    return NextResponse.json(
      await postalService.createPickupPoint(input, actor),
      { status: 201 },
    );
  } catch (error) {
    return controllerErrorResponse(error, 'createPickupPoint failed');
  }
}

export async function GET() {
  try {
    return NextResponse.json(await postalService.listPickupPoints());
  } catch (error) {
    return controllerErrorResponse(error, 'Pickup points failed');
  }
}
