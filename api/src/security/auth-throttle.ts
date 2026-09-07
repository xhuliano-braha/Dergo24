import { ApiError } from '../errors/api-error';

const attempts = new Map<string, { count: number; expires: number }>();

export class ThrottleError extends ApiError {
  constructor(public readonly retryAfter: number) {
    super('Shumë tentativa. Provoni përsëri më vonë.', 429);
  }
}

export async function throttleAuth(identity: string, limit = 10, seconds = 900) {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(identity.trim().toLowerCase()),
  );
  const key = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
  const now = Date.now();
  for (const [entry, value] of attempts) {
    if (value.expires <= now) attempts.delete(entry);
  }
  const current = attempts.get(key);
  if (current) {
    if (current.count >= limit)
      throw new ThrottleError(Math.max(1, Math.ceil((current.expires - now) / 1000)));
    current.count += 1;
  } else {
    if (attempts.size >= 10000) throw new ThrottleError(60);
    attempts.set(key, { count: 1, expires: now + seconds * 1000 });
  }
}
