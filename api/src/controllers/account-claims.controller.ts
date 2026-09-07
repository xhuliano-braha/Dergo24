import { NextRequest, NextResponse } from 'next/server';
import {
  getAuthenticatedCustomer,
  customerUnauthorizedResponse,
} from '../lib/customer-auth';
import { claimCreateSchema } from '../schemas/postal.schema';
import { postalService } from '../services/postal.service';
import { controllerErrorResponse } from './controller-response';
import { parseJson } from './request-input';

export async function POST(request: NextRequest) {
  try {
    const actor = await getAuthenticatedCustomer(request);
    if (!actor) return customerUnauthorizedResponse();
    const input = await parseJson(
      request,
      claimCreateSchema,
      'Kontrolloni të dhënat e kërkesës.',
    );
    return NextResponse.json(await postalService.createClaim(input, actor), {
      status: 201,
    });
  } catch (error) {
    return controllerErrorResponse(error, 'createClaim failed');
  }
}
