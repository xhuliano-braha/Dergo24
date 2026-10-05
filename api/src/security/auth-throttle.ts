import { isIP } from 'node:net';
import { ApiError } from '../errors/api-error';
import { securityRepository } from '../repositories/security.repository';

export class ThrottleError extends ApiError {
  constructor(public readonly retryAfter: number) {
    super('Shumë tentativa. Provoni përsëri më vonë.', 429);
  }
}

export async function hashSecret(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function requestClient(request: Request) {
  const hostname = new URL(request.url).hostname;
  if (process.env.NODE_ENV !== 'production' && ['localhost', '127.0.0.1', '[::1]'].includes(hostname))
    return 'local-development';
  let address = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip');
  if (!address || !isIP(address)) {
    address = '127.0.0.1';
  }
  const secret = process.env.RATE_LIMIT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'dergo24-default-rate-limit-secret-key-32chars';
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(address.toLowerCase()));
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function throttleAuth(identity: string, limit = 10, seconds = 900) {
  const key = await hashSecret(identity.trim().toLowerCase());
  const { data, error } = await securityRepository.consume(key, limit, seconds);
  if (error || typeof data !== 'number') throw new ApiError('Mbrojtja e kërkesave nuk është e disponueshme.', 503);
  if (data > 0) throw new ThrottleError(data);
}
