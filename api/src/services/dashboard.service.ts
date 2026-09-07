import { ApiError } from '../errors/api-error';
import { dashboardRepository } from '../repositories/dashboard.repository';
import type { StaffProfile, CustomerProfile } from '../types/profiles';
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
      shipments: shipmentsResult.data ?? [],
      quotes: staff.role === 'courier' ? [] : (quotesResult.data ?? []),
      drivers:
        staff.role === 'courier'
          ? (driversResult.data ?? []).filter(
              (driver) => driver.staff_id === staff.id,
            )
          : (driversResult.data ?? []),
      staffAccounts: staff.role === 'courier' ? [] : (staffResult.data ?? []),
      claims: staff.role === 'courier' ? [] : (claimsResult.data ?? []),
      ratings: staff.role === 'courier' ? [] : (ratingsResult.data ?? []),
      pickupPoints: pointsResult.data ?? [],
    };
  },
  async customer(customer: CustomerProfile) {
    const { data, error } = await dashboardRepository.customer(customer.id);
    if (error) throw new ApiError('Dërgesat nuk mund të ngarkoheshin.', 503);
    return { customer, shipments: data ?? [] };
  },
};
