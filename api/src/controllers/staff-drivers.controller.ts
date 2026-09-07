import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedStaff, unauthorizedResponse } from '../lib/staff-auth';
import { driverCreateSchema } from '../lib/staff-schemas';
import { postalService } from '../services/postal.service';
import { controllerErrorResponse } from './controller-response';
import { parseJson } from './request-input';

export async function POST(request: NextRequest) {
  try {
    const actor = await getAuthenticatedStaff(request);
    if (!actor) return unauthorizedResponse();
    const input = await parseJson(
      request,
      driverCreateSchema,
      'Kontrolloni të dhënat e kërkesës.',
    );
    return NextResponse.json(await postalService.createDriver(input, actor), {
      status: 201,
    });
  } catch (error) {
    return controllerErrorResponse(error, 'createDriver failed');
  }
}
