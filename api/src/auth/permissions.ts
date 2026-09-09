import { ApiError } from '../errors/api-error';
import type { PermissionCode, StaffProfile } from '../types/profiles';

export function hasPermission(staff: StaffProfile, permission: PermissionCode) {
  return staff.permissions.includes(permission);
}

export function requirePermission(
  staff: StaffProfile,
  permission: PermissionCode,
) {
  if (!hasPermission(staff, permission))
    throw new ApiError('Nuk keni leje për këtë veprim.', 403);
}
