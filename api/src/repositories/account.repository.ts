import { getSupabaseAdmin } from '../lib/supabase-admin';
import type { StaffProfile } from '../types/profiles';

type CustomerInsert = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  terms_accepted_at: string;
  privacy_accepted_at: string;
};

type StaffInsert = {
  id: string;
  full_name: string;
  email: string;
  role: StaffProfile['role'];
  active: boolean;
};

export const accountRepository = {
  findActiveCustomer(id: string) {
    return getSupabaseAdmin()
      .from('customer_profiles')
      .select('id, full_name, email, phone, active')
      .eq('id', id)
      .eq('active', true)
      .maybeSingle();
  },
  findActiveStaff(id: string) {
    return getSupabaseAdmin()
      .from('staff_profiles')
      .select('id, full_name, email, role, active')
      .eq('id', id)
      .eq('active', true)
      .maybeSingle();
  },
  createCustomer(profile: CustomerInsert) {
    return getSupabaseAdmin().from('customer_profiles').insert(profile);
  },
  createStaff(profile: StaffInsert) {
    return getSupabaseAdmin().from('staff_profiles').insert(profile);
  },
  updateStaff(id: string, changes: Pick<StaffInsert, 'role' | 'active'>) {
    return getSupabaseAdmin()
      .from('staff_profiles')
      .update(changes)
      .eq('id', id)
      .select('id')
      .maybeSingle();
  },
};
