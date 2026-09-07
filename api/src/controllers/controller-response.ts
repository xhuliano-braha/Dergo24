import { NextResponse } from 'next/server';
import { ApiError } from '../errors/api-error';
import { ThrottleError } from '../security/auth-throttle';

export function controllerErrorResponse(error: unknown, context: string) {
  if (error instanceof ApiError)
    return NextResponse.json(
      { error: error.message },
      {
        status: error.status,
        headers: error instanceof ThrottleError
          ? { 'Retry-After': String(error.retryAfter) }
          : undefined,
      },
    );

  console.error(context, error);
  return NextResponse.json(
    { error: 'Shërbimi nuk është përkohësisht i disponueshëm.' },
    { status: 503 },
  );
}
