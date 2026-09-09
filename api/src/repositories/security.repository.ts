import { getSupabaseAdmin } from '../lib/supabase-admin';

export const securityRepository = {
  consume(key: string, limit: number, seconds: number) {
    return getSupabaseAdmin().rpc('consume_request_limit', { p_key: key, p_limit: limit, p_seconds: seconds });
  },
  generation(userId: string) {
    return getSupabaseAdmin().rpc('auth_generation', { p_user: userId });
  },
  issue(userId: string, generation: number, hash: string, audience: string) {
    return getSupabaseAdmin().rpc('issue_app_session', { p_user: userId, p_generation: generation, p_hash: hash, p_audience: audience });
  },
  lookup(hash: string, audience: string) {
    return getSupabaseAdmin().rpc('lookup_app_session', { p_hash: hash, p_audience: audience });
  },
  revoke(hash: string, audience: string) {
    return getSupabaseAdmin().from('app_sessions').delete().eq('token_hash', hash).eq('audience', audience);
  },
  revokeUser(userId: string) {
    return getSupabaseAdmin().rpc('revoke_user_sessions', { p_user: userId });
  },
};
