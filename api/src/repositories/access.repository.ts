import { getSupabaseAdmin } from '../lib/supabase-admin';
import type { PermissionCode } from '../types/profiles';

export const accessRepository = {
  listRoles() {
    return getSupabaseAdmin()
      .from('roles')
      .select('id, name, role_permissions(permissions(code))')
      .order('name');
  },
  setRolePermissions(
    roleId: number,
    permissions: PermissionCode[],
    actorId: string,
  ) {
    return getSupabaseAdmin().rpc('set_role_permissions_atomic', {
      p_role_id: roleId,
      p_permissions: [...new Set(permissions)],
      p_actor: actorId,
    });
  },
  listAuditLogs() {
    return getSupabaseAdmin()
      .from('staff_audit_logs')
      .select(
        'id, action, target_type, target_id, changes, created_at, staff_profiles(full_name, email)',
      )
      .order('created_at', { ascending: false })
      .limit(50);
  },
};
