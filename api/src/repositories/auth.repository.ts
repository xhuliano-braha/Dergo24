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
    return getSupabaseAdmin().auth.admin.createUser({ email, password, email_confirm: false, user_metadata: { full_name: fullName } });
  },
  sendConfirmation(email: string) {
    return getSupabaseAdmin().auth.resend({ type: 'signup', email });
  },
  verifyEmail(email: string, token: string) {
    return getSupabaseAdmin().auth.verifyOtp({ email, token, type: 'email' });
  },
  deleteUser(id: string) {
    return getSupabaseAdmin().auth.admin.deleteUser(id);
  },
  changePassword(id: string, password: string) {
    return getSupabaseAdmin().auth.admin.updateUserById(id, { password });
  },
};
