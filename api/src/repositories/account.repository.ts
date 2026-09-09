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
  role_id: number;
  active: boolean;
};

export const accountRepository = {
  findLoginProfile(email: string, audience: 'customer' | 'staff') {
    return getSupabaseAdmin()
      .from(audience === 'staff' ? 'staff_profiles' : 'customer_profiles')
      .select('id')
      .eq('email', email.toLowerCase())
      .eq('active', true)
      .maybeSingle();
  },
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
      .select(
        'id, full_name, email, role_id, roles!inner(name, role_permissions(permissions(code))), active',
      )
      .eq('id', id)
      .eq('active', true)
      .maybeSingle();
  },
  findRoleByName(name: StaffProfile['role']) {
    return getSupabaseAdmin()
      .from('roles')
      .select('id')
      .eq('name', name)
      .maybeSingle();
  },
  createCustomer(profile: CustomerInsert) {
    return getSupabaseAdmin().from('customer_profiles').insert(profile);
  },
  createStaff(profile: StaffInsert) {
    return getSupabaseAdmin().from('staff_profiles').insert(profile);
  },
  updateStaffAccess(
    id: string,
    changes: Pick<StaffInsert, 'role_id' | 'active'>,
    actorId: string,
  ) {
    return getSupabaseAdmin().rpc('update_staff_access_atomic', {
      p_target: id,
      p_role_id: changes.role_id,
      p_active: changes.active,
      p_actor: actorId,
    });
  },
};
