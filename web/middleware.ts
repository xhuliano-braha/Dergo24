import { NextRequest, NextResponse } from 'next/server';
import { assertSameOrigin } from '../api/src/security/request-security';
import { requestClient, throttleAuth } from '../api/src/security/auth-throttle';
import { controllerErrorResponse } from '../api/src/controllers/controller-response';

export async function middleware(request: NextRequest) {
  let response: NextResponse;
  try {
    assertSameOrigin(request);
    const pathname = request.nextUrl.pathname.replace(/\/$/, '');
    if (pathname.startsWith('/api/')) {
      const client = await requestClient(request);
      await throttleAuth(`requests:${client}`, 300, 60);
      if (request.method === 'POST' && /^\/api\/(staff\/(auth|password)|account\/(auth|register|resend|verify|password))$/.test(pathname))
        await throttleAuth(`auth:${client}`, 30, 60);
      if (request.method === 'POST' && ['/api/shipments', '/api/quote-requests'].includes(pathname))
        await throttleAuth(`booking:${client}`, 10, 3600);
      if (request.method === 'GET' && pathname === '/api/shipments')
        await throttleAuth(`tracking:${client}`, 60, 60);
    }
    response = NextResponse.next();
  } catch (error) {
    response = controllerErrorResponse(error, 'Request protection failed');
  }
  if (/^\/(api|account|staff|courier)(\/|$)/.test(request.nextUrl.pathname))
    response.headers.set('Cache-Control', 'private, no-store');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'no-referrer');
  response.headers.set('Content-Security-Policy', "frame-ancestors 'none'; object-src 'none'; base-uri 'self'");
  return response;
}

export const config = { matcher: '/:path*' };
