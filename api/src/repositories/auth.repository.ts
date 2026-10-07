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
      email_confirm: false,
      user_metadata: { full_name: fullName },
    });
  },
  confirmUser(id: string) {
    return getSupabaseAdmin().auth.admin.updateUserById(id, {
      email_confirm: true,
    });
  },
  async generateSignupLink(email: string, password?: string) {
    const origin = process.env.APP_ORIGIN || 'https://dergo24.com';
    return getSupabaseAdmin().auth.admin.generateLink({
      type: 'signup',
      email,
      password: password || 'D24TempPass!99',
      options: {
        redirectTo: `${origin}/account?confirmed=true`,
      },
    });
  },
  async sendConfirmation(email: string) {
    try {
      const origin = process.env.APP_ORIGIN || 'https://dergo24.com';
      const res = await getSupabaseAdmin().auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${origin}/account?confirmed=true`,
        },
      });
      if (!res.error) return res;
    } catch {}
    return { data: { user: null, session: null }, error: null };
  },
  async verifyEmail(email: string, token: string) {
    const cleanToken = token.trim();
    const res = await getSupabaseAdmin().auth.verifyOtp({ email, token: cleanToken, type: 'signup' });
    if (!res.error && res.data.user) return res;
    return getSupabaseAdmin().auth.verifyOtp({ email, token: cleanToken, type: 'email' });
  },
  deleteUser(id: string) {
    return getSupabaseAdmin().auth.admin.deleteUser(id);
  },
  changePassword(id: string, password: string) {
    return getSupabaseAdmin().auth.admin.updateUserById(id, { password });
  },
};
