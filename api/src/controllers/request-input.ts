import type { NextRequest } from 'next/server';
import type { ZodType } from 'zod';
import { z } from 'zod';
import { ApiError } from '../errors/api-error';
import { readLimitedBody } from '../security/request-security';

export async function parseJson<Input>(
  request: NextRequest,
  schema: ZodType<Input>,
  message: string,
): Promise<Input> {
  let body: unknown;
  if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json')
    throw new ApiError('Përdorni application/json.', 415);
  const bytes = await readLimitedBody(request, 1024 * 1024);
  try {
    body = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new ApiError('Kërkesa nuk është e vlefshme.', 400);
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) throw new ApiError(message, 400);
  return parsed.data;
}

export type IdRouteContext = { params: Promise<{ id: string }> };

export async function parseId(context: IdRouteContext) {
  const { id } = await context.params;
  if (!z.uuid().safeParse(id).success)
    throw new ApiError('ID nuk është e vlefshme.', 400);
  return id;
}
