import { NextRequest, NextResponse } from 'next/server';

import { quoteRequestSchema } from '../lib/quote-requests';
import { postalService } from '../services/postal.service';
import { controllerErrorResponse } from './controller-response';
import { parseJson } from './request-input';
export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest) {
  try {
    const input = await parseJson(
      request,
      quoteRequestSchema,
      'Kontrolloni të dhënat e kërkesës.',
    );
    return NextResponse.json(await postalService.createQuote(input), {
      status: 201,
    });
  } catch (error) {
    return controllerErrorResponse(error, 'createQuote failed');
  }
}
