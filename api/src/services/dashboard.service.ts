import { ApiError } from '../errors/api-error';
import { dashboardRepository } from '../repositories/dashboard.repository';
import type { StaffProfile, CustomerProfile } from '../types/profiles';
import { hasPermission } from '../auth/permissions';
export const dashboardService = {
  async staff(staff: StaffProfile) {
    const {
      shipmentsResult,
      quotesResult,
      driversResult,
      staffResult,
      claimsResult,
      ratingsResult,
      pointsResult,
    } = await dashboardRepository.staff(staff.id, staff.role === 'courier');

    const error =
      shipmentsResult.error ??
      quotesResult.error ??
      driversResult.error ??
      staffResult.error ??
      claimsResult.error ??
      ratingsResult.error ??
      pointsResult.error;
    if (error) throw new ApiError('Të dhënat nuk mund të ngarkoheshin.', 503);

    return {
      staff,
      shipments: hasPermission(staff, 'shipments.view')
        ? (shipmentsResult.data ?? [])
        : [],
      quotes: hasPermission(staff, 'quotes.view')
        ? (quotesResult.data ?? [])
        : [],
      drivers: !hasPermission(staff, 'drivers.view')
        ? []
        : staff.role === 'courier'
          ? (driversResult.data ?? []).filter(
              (driver) => driver.staff_id === staff.id,
            )
          : (driversResult.data ?? []),
      staffAccounts: !hasPermission(staff, 'staff.view')
        ? []
        : (staffResult.data ?? []).map(({ roles, ...account }) => {
            const relation = roles as unknown;
            const role = Array.isArray(relation) ? relation[0] : relation;
            return {
              ...account,
              role:
                role && typeof role === 'object' && 'name' in role
                  ? role.name
                  : null,
            };
          }),
      claims: hasPermission(staff, 'claims.view')
        ? (claimsResult.data ?? [])
        : [],
      ratings: hasPermission(staff, 'ratings.view')
        ? (ratingsResult.data ?? [])
        : [],
      pickupPoints: pointsResult.data ?? [],
    };
  },
  async customer(customer: CustomerProfile) {
    const { data, error } = await dashboardRepository.customer(customer.id);
    if (error) throw new ApiError('Dërgesat nuk mund të ngarkoheshin.', 503);
    return { customer, shipments: data ?? [] };
  },
};
