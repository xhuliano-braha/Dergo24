import type { output } from 'zod';
import { requirePermission } from '../auth/permissions';
import { ApiError } from '../errors/api-error';
import type { rolePermissionsUpdateSchema } from '../lib/account-schemas';
import { accessRepository } from '../repositories/access.repository';
import type { PermissionCode, StaffProfile } from '../types/profiles';

function relationCode(relation: unknown): PermissionCode | null {
  const value = Array.isArray(relation) ? relation[0] : relation;
  return value &&
    typeof value === 'object' &&
    'code' in value &&
    typeof value.code === 'string'
    ? (value.code as PermissionCode)
    : null;
}

export const accessService = {
  async list(actor: StaffProfile) {
    requirePermission(actor, 'staff.manage');
    const [rolesResult, auditResult] = await Promise.all([
      accessRepository.listRoles(),
      accessRepository.listAuditLogs(),
    ]);
    if (rolesResult.error || auditResult.error)
      throw new ApiError('Rolet nuk mund të ngarkoheshin.', 503);

    return {
      roles: (rolesResult.data ?? []).map((role) => ({
        id: role.id,
        name: role.name,
        permissions: role.role_permissions
          .map((link) => relationCode(link.permissions))
          .filter((code): code is PermissionCode => code !== null),
      })),
      auditLogs: (auditResult.data ?? []).map(({ staff_profiles, ...log }) => {
        const relation = staff_profiles as unknown;
        const staff = Array.isArray(relation) ? relation[0] : relation;
        return {
          ...log,
          actor:
            staff && typeof staff === 'object' && 'full_name' in staff
              ? {
                  fullName: staff.full_name,
                  email: 'email' in staff ? staff.email : null,
                }
              : null,
        };
      }),
    };
  },
  async update(
    roleId: number,
    input: output<typeof rolePermissionsUpdateSchema>,
    actor: StaffProfile,
  ) {
    requirePermission(actor, 'staff.manage');
    const { error } = await accessRepository.setRolePermissions(
      roleId,
      input.permissions,
      actor.id,
    );
    if (error) {
      if (error.code === 'PT400') throw new ApiError(error.message, 400);
      if (error.code === 'PT404') throw new ApiError('Roli nuk u gjet.', 404);
      throw new ApiError('Permission-et nuk mund të ruheshin.', 503);
    }
    return { success: true };
  },
};
