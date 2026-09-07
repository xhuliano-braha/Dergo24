import type { output } from 'zod';
import { requireRole } from '../auth/permissions';
import { ApiError } from '../errors/api-error';
import type {
  driverCreateSchema,
  driverUpdateSchema,
  quoteUpdateSchema,
} from '../lib/staff-schemas';
import type { quoteRequestSchema } from '../lib/quote-requests';
import { accountRepository } from '../repositories/account.repository';
import { postalRepository } from '../repositories/postal.repository';
import type {
  claimCreateSchema,
  claimUpdateSchema,
  ratingSchema,
  pickupPointSchema,
} from '../schemas/postal.schema';
import type { StaffProfile, CustomerProfile } from '../types/profiles';

export const postalService = {
  async createDriver(
    input: output<typeof driverCreateSchema>,
    staff: StaffProfile,
  ) {
    requireRole(staff, ['admin', 'dispatcher']);
    const { error } = await postalRepository.createDriver({
      full_name: input.fullName,
      phone: input.phone,
    });
    if (error)
      throw new ApiError(
        'Korrieri nuk mund të ruhej. Telefoni mund të jetë në përdorim.',
        409,
      );
    return { success: true };
  },
  async updateDriver(
    id: string,
    input: output<typeof driverUpdateSchema>,
    staff: StaffProfile,
  ) {
    requireRole(staff, ['admin', 'dispatcher']);
    if (input.staffId) {
      const { data: linkedStaff, error } =
        await accountRepository.findActiveStaff(input.staffId);
      if (error) throw new ApiError('Llogaria nuk mund të ngarkohej.', 503);
      if (!linkedStaff || linkedStaff.role !== 'courier')
        throw new ApiError('Zgjidhni një llogari aktive korrieri.', 400);
    }
    const { data, error } = await postalRepository.updateDriver(id, {
      status: input.status,
      active: input.active,
      staff_id: input.staffId,
    });
    if (error) throw new ApiError('Korrieri nuk mund të përditësohej.', 503);
    if (!data) throw new ApiError('Korrieri nuk u gjet.', 404);
    return { success: true };
  },
  async createQuote(input: output<typeof quoteRequestSchema>) {
    const referenceCode = `OF-${new Date().getFullYear().toString().slice(-2)}-${crypto.randomUUID().replace(/-/g, '').slice(0, 7).toUpperCase()}`;
    const { error } = await postalRepository.createQuote({
      id: crypto.randomUUID(),
      reference_code: referenceCode,
      customer_name: input.customerName,
      phone: input.phone,
      pickup_city: input.pickupCity,
      delivery_city: input.deliveryCity,
      item_type: input.itemType,
      description: input.description,
      status: 'new',
    });
    if (error)
      throw new ApiError('Kërkesa nuk mund të ruhej. Provoni përsëri.', 503);
    return { referenceCode };
  },
  async updateQuote(
    id: string,
    input: output<typeof quoteUpdateSchema>,
    staff: StaffProfile,
  ) {
    requireRole(staff, ['admin', 'dispatcher', 'support']);
    const { data, error } = await postalRepository.updateQuote(id, {
      status: input.status,
      quoted_price_all: input.quotedPrice,
      assigned_to: staff.id,
      updated_at: new Date().toISOString(),
    });
    if (error) throw new ApiError('Oferta nuk mund të përditësohej.', 503);
    if (!data) throw new ApiError('Oferta nuk u gjet.', 404);
    return { success: true };
  },
  async createClaim(
    input: output<typeof claimCreateSchema>,
    customer: CustomerProfile,
  ) {
    const { data: shipment, error: lookupError } =
      await postalRepository.findCustomerShipment(
        input.shipmentId,
        customer.id,
      );
    if (lookupError) throw new ApiError('Dërgesa nuk mund të ngarkohej.', 503);
    if (!shipment) throw new ApiError('Dërgesa nuk u gjet.', 404);
    const { error } = await postalRepository.createClaim({
      shipment_id: shipment.id,
      customer_id: customer.id,
      claim_type: input.claimType,
      description: input.description,
      requested_refund_all: input.requestedRefund,
    });
    if (error) throw new ApiError('Kërkesa nuk mund të ruhej.', 503);
    return { success: true };
  },
  async updateClaim(
    id: string,
    input: output<typeof claimUpdateSchema>,
    staff: StaffProfile,
  ) {
    requireRole(staff, ['admin', 'dispatcher', 'support']);
    const { data, error } = await postalRepository.updateClaim(id, {
      status: input.status,
      approved_refund_all: input.approvedRefund,
      staff_notes: input.staffNotes || null,
      updated_at: new Date().toISOString(),
    });
    if (error) throw new ApiError('Kërkesa nuk u përditësua.', 503);
    if (!data) throw new ApiError('Kërkesa nuk u gjet.', 404);
    return { success: true };
  },
  async saveRating(
    input: output<typeof ratingSchema>,
    customer: CustomerProfile,
  ) {
    const { data: shipment, error: lookupError } =
      await postalRepository.findCustomerShipment(
        input.shipmentId,
        customer.id,
      );
    if (lookupError) throw new ApiError('Dërgesa nuk mund të ngarkohej.', 503);
    if (!shipment || shipment.status !== 'U dorëzua' || !shipment.driver_id)
      throw new ApiError(
        'Mund të vlerësoni vetëm një dërgesë të përfunduar.',
        400,
      );
    const { error } = await postalRepository.saveRating({
      shipment_id: shipment.id,
      customer_id: customer.id,
      driver_id: shipment.driver_id,
      rating: input.rating,
      comment: input.comment || null,
    });
    if (error) throw new ApiError('Vlerësimi nuk mund të ruhej.', 503);
    return { success: true };
  },
  async listPickupPoints() {
    const { data, error } = await postalRepository.listPickupPoints();
    if (error) throw new ApiError('Pikat nuk mund të ngarkoheshin.', 503);
    return { points: data ?? [] };
  },
  async createPickupPoint(
    input: output<typeof pickupPointSchema>,
    staff: StaffProfile,
  ) {
    requireRole(staff, ['admin']);
    const { error } = await postalRepository.createPickupPoint({
      name: input.name,
      city: input.city,
      address: input.address,
      opening_hours: input.openingHours,
    });
    if (error) throw new ApiError('Pika nuk mund të ruhej.', 503);
    return { success: true };
  },
};
