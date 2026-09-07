import { ApiError } from '../errors/api-error';
import type { StaffProfile } from '../types/profiles';

export function requireRole(
  staff: StaffProfile,
  roles: readonly StaffProfile['role'][],
) {
  if (!roles.includes(staff.role))
    throw new ApiError('Nuk keni leje për këtë veprim.', 403);
}
