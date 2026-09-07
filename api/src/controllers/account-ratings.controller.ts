import { NextRequest, NextResponse } from 'next/server';
import {
  getAuthenticatedCustomer,
  customerUnauthorizedResponse,
} from '../lib/customer-auth';
import { ratingSchema } from '../schemas/postal.schema';
import { postalService } from '../services/postal.service';
import { controllerErrorResponse } from './controller-response';
import { parseJson } from './request-input';

export async function POST(request: NextRequest) {
  try {
    const actor = await getAuthenticatedCustomer(request);
    if (!actor) return customerUnauthorizedResponse();
    const input = await parseJson(
      request,
      ratingSchema,
      'Kontrolloni të dhënat e kërkesës.',
    );
    return NextResponse.json(await postalService.saveRating(input, actor), {
      status: 200,
    });
  } catch (error) {
    return controllerErrorResponse(error, 'saveRating failed');
  }
}
