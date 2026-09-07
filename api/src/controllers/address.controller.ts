import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validateAlbanianAddress } from '../lib/albania-address';
import { parseJson } from './request-input';
import { controllerErrorResponse } from './controller-response';

const schema = z.object({
  city: z.string().trim().min(2).max(60),
  address: z.string().trim().min(2).max(180),
});

export async function POST(request: NextRequest) {
  try {
    const input = await parseJson(request, schema, 'Plotësoni qytetin dhe adresën.');
    return NextResponse.json(
      validateAlbanianAddress(input.city, input.address),
    );
  } catch (error) {
    return controllerErrorResponse(error, 'Address validation failed');
  }
}
