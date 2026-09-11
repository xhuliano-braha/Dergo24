import { getSupabaseAdmin } from '../lib/supabase-admin';

export const healthRepository = {
  database() {
    return getSupabaseAdmin()
      .from('roles')
      .select('id', { count: 'exact', head: true });
  },
};
