import { getSupabaseAdmin } from '../lib/supabase-admin';

export const authRepository = {
  signIn(email: string, password: string) {
    return getSupabaseAdmin().auth.signInWithPassword({ email, password });
  },
  getUser(accessToken: string) {
    return getSupabaseAdmin().auth.getUser(accessToken);
  },
  createUser(email: string, password: string, fullName: string) {
    return getSupabaseAdmin().auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
  },
  createUnconfirmedCustomer(email: string, password: string, fullName: string) {
    return getSupabaseAdmin().auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
  },
  confirmUser(id: string) {
    return getSupabaseAdmin().auth.admin.updateUserById(id, {
      email_confirm: true,
    });
  },
  async sendConfirmation(email: string) {
    try {
      const res = await getSupabaseAdmin().auth.resend({ type: 'signup', email });
      if (!res.error) return res;
    } catch {}
    return { data: { user: null, session: null }, error: null };
  },
  async verifyEmail(email: string, token: string) {
    const res = await getSupabaseAdmin().auth.verifyOtp({ email, token, type: 'signup' });
    if (!res.error && res.data.user) return res;
    return getSupabaseAdmin().auth.verifyOtp({ email, token, type: 'email' });
  },
  deleteUser(id: string) {
    return getSupabaseAdmin().auth.admin.deleteUser(id);
  },
  changePassword(id: string, password: string) {
    return getSupabaseAdmin().auth.admin.updateUserById(id, { password });
  },
};
