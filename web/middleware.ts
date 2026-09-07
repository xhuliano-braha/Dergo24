import { NextRequest, NextResponse } from 'next/server';
import { assertSameOrigin } from '../api/src/security/request-security';
import { throttleAuth } from '../api/src/security/auth-throttle';
import { controllerErrorResponse } from '../api/src/controllers/controller-response';

export async function middleware(request: NextRequest) {
  let response: NextResponse;
  try {
    assertSameOrigin(request);
    if (
      request.method === 'POST' &&
      /^\/api\/(staff\/auth|account\/(auth|register))\/?$/.test(request.nextUrl.pathname)
    )
      await throttleAuth('auth-request-budget', 60, 60);
    response = NextResponse.next();
  } catch (error) {
    response = controllerErrorResponse(error, 'Request protection failed');
  }
  response.headers.set('Cache-Control', 'private, no-store');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'no-referrer');
  return response;
}

export const config = { matcher: '/api/:path*' };
