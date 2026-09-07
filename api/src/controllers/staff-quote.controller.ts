import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedStaff, unauthorizedResponse } from '../lib/staff-auth';
import { quoteUpdateSchema } from '../lib/staff-schemas';
import { postalService } from '../services/postal.service';
import { controllerErrorResponse } from './controller-response';
import { parseJson, parseId, type IdRouteContext } from './request-input';

export async function PATCH(request: NextRequest, context: IdRouteContext) {
  try {
    const actor = await getAuthenticatedStaff(request);
    if (!actor) return unauthorizedResponse();
    const input = await parseJson(
      request,
      quoteUpdateSchema,
      'Kontrolloni të dhënat e kërkesës.',
    );
    return NextResponse.json(
      await postalService.updateQuote(await parseId(context), input, actor),
      { status: 200 },
    );
  } catch (error) {
    return controllerErrorResponse(error, 'updateQuote failed');
  }
}
