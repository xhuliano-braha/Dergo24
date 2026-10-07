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
      customersResult,
      authUsersResult,
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

    const confirmedMap = new Map<string, boolean>(
      (authUsersResult?.data?.users || []).map(
        (user: { id: string; email_confirmed_at?: string | null }) => [
          user.id,
          Boolean(user.email_confirmed_at),
        ],
      ),
    );

    const registeredCustomers =
      hasPermission(staff, 'staff.view') || staff.role === 'admin'
        ? (customersResult.data ?? []).map(
            (customer: {
              id: string;
              full_name: string;
              email: string;
              phone: string;
              active: boolean;
              created_at: string;
            }) => ({
              ...customer,
              is_verified: confirmedMap.get(customer.id) ?? false,
            }),
          )
        : [];

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
      registeredCustomers,
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
    if (error) {
      console.error('Customer shipments fetch error:', error);
      return { customer, shipments: [] };
    }
    return { customer, shipments: data ?? [] };
  },
};
