import { ApiError } from '../errors/api-error';
import { securityRepository } from '../repositories/security.repository';
import { hashSecret } from './auth-throttle';

export type SessionAudience = 'staff' | 'customer';

export async function issueSession(userId: string, generation: number, audience: SessionAudience) {
  const token = Array.from(crypto.getRandomValues(new Uint8Array(32)), (byte) => byte.toString(16).padStart(2, '0')).join('');
  const { error } = await securityRepository.issue(userId, generation, await hashSecret(token), audience);
  if (error) throw new ApiError('Hyni përsëri. Sesioni nuk u krijua.', 503);
  return { access_token: token, expires_in: 3600 };
}

export async function sessionUser(token: string, audience: SessionAudience) {
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  const { data, error } = await securityRepository.lookup(await hashSecret(token), audience);
  if (error) throw new ApiError('Sesioni nuk mund të verifikohej.', 503);
  return typeof data === 'string' ? data : null;
}

export async function revokeSession(token: string | undefined, audience: SessionAudience) {
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return;
  const { error } = await securityRepository.revoke(await hashSecret(token), audience);
  if (error) throw new ApiError('Dalja nuk u përfundua. Provoni përsëri.', 503);
}

export async function revokeUserSessions(userId: string) {
  const { error } = await securityRepository.revokeUser(userId);
  if (error) throw new ApiError('Sesionet nuk mund të mbylleshin.', 503);
}
