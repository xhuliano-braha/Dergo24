import type { output } from 'zod';
import { requirePermission } from '../auth/permissions';
import { ApiError } from '../errors/api-error';
import { deliveryRepository } from '../repositories/delivery.repository';
import { atomicWriteError } from '../errors/atomic-write-error';
import type { DeliveryProofInput } from '../schemas/delivery-proof.schema';
import type { routePlanSchema } from '../schemas/postal.schema';
import type { StaffProfile } from '../types/profiles';
import { validatePhoto } from '../security/image-validation';

async function accessibleShipment(id: string, staff: StaffProfile) {
  requirePermission(staff, 'shipments.view');
  const { data: shipment, error } = await deliveryRepository.findShipment(id);
  if (error) throw new ApiError('Dërgesa nuk mund të ngarkohej.', 503);
  if (!shipment) throw new ApiError('Dërgesa nuk u gjet.', 404);
  if (staff.role === 'courier') {
    const { data: driver, error: driverError } =
      await deliveryRepository.findDriver(staff.id);
    if (driverError) throw new ApiError('Korrieri nuk mund të ngarkohej.', 503);
    if (!driver || driver.id !== shipment.driver_id)
      throw new ApiError('Nuk keni akses në këtë dërgesë.', 403);
  }
  return shipment;
}

export const deliveryService = {
  async label(id: string, staff: StaffProfile) {
    const shipment = await accessibleShipment(id, staff);
    const { data, error } = await deliveryRepository.label(
      id,
      staff.role === 'courier' ? shipment.driver_id : null,
    );
    if (error) throw new ApiError('Etiketa nuk mund të ngarkohej.', 503);
    if (!data) throw new ApiError('Dërgesa nuk u gjet.', 404);
    return { shipment: data };
  },
  async settle(id: string, staff: StaffProfile) {
    requirePermission(staff, 'cod.settle');
    const { data, error } = await deliveryRepository.settle(id);
    if (error) throw new ApiError('Arkëtimi nuk mund të mbyllej.', 503);
    if (!data)
      throw new ApiError('Arkëtimi nuk është në pritje të mbylljes.', 409);
    return { success: true };
  },
  async proof(id: string, staff: StaffProfile) {
    await accessibleShipment(id, staff);
    const { data: proof, error } = await deliveryRepository.proof(id);
    if (error) throw new ApiError('Prova nuk mund të ngarkohej.', 503);
    if (!proof) return { proof: null };
    let photoUrl: string | null = null;
    if (proof.photo_path) {
      const { data, error: photoError } = await deliveryRepository.signPhoto(
        proof.photo_path,
      );
      if (photoError) throw new ApiError('Fotoja nuk mund të ngarkohej.', 503);
      photoUrl = data?.signedUrl ?? null;
    }
    return { proof: { ...proof, photoUrl } };
  },
  async saveProof(id: string, input: DeliveryProofInput, staff: StaffProfile) {
    requirePermission(staff, 'shipments.deliver');
    const shipment = await accessibleShipment(id, staff);
    if (
      shipment.status === 'U dorëzua' ||
      shipment.status === 'U anulua' ||
      shipment.cod_status === 'settled'
    )
      throw new ApiError('Dërgesa është mbyllur.', 409);
    if (input.codCollected !== shipment.cod_amount_all)
      throw new ApiError(
        `Duhet të mblidhen saktësisht ${shipment.cod_amount_all} Lekë.`,
        400,
      );
    let photoPath: string | null = null;
    if (input.photo) {
      const photo = await validatePhoto(input.photo);
      const extension = photo.type === 'image/png' ? 'png' : 'jpg';
      photoPath = `${id}/${crypto.randomUUID()}.${extension}`;
      const { error } = await deliveryRepository.uploadPhoto(photoPath, photo);
      if (error) throw new ApiError('Fotoja e dorëzimit nuk u ngarkua.', 503);
    }
    const { error } = await deliveryRepository.confirmAtomic(id, staff.id, {
      recipient_name: input.recipientName,
      signature_data: input.signatureData,
      photo_path: photoPath,
      notes: input.notes || null,
      cod_collected_all: input.codCollected,
      latitude: input.latitude,
      longitude: input.longitude,
    });
    if (error)
      throw atomicWriteError(error, 'Dorëzimi nuk mund të konfirmohej.');
    return { success: true };
  },
  async optimize(input: output<typeof routePlanSchema>, staff: StaffProfile) {
    requirePermission(staff, 'routes.optimize');
    const { data, error } = await deliveryRepository.routeStops(
      input.driverId,
      input.pickupDate,
    );
    if (error) throw new ApiError('Dërgesat nuk mund të planifikoheshin.', 503);
    const windowOrder: Record<string, number> = {
      '09:00-13:00': 0,
      '13:00-17:00': 1,
      '17:00-20:00': 2,
      anytime: 3,
    };
    const ordered = [...(data ?? [])].sort(
      (first, second) =>
        (windowOrder[first.delivery_window] ?? 3) -
          (windowOrder[second.delivery_window] ?? 3) ||
        Number(second.service === 'express') -
          Number(first.service === 'express') ||
        first.delivery_city.localeCompare(second.delivery_city, 'sq') ||
        first.delivery_address.localeCompare(second.delivery_address, 'sq') ||
        +new Date(first.created_at) - +new Date(second.created_at),
    );
    const results = await Promise.all(
      ordered.map((shipment, index) =>
        deliveryRepository.setRouteOrder(shipment.id, index + 1),
      ),
    );
    if (results.some((result) => result.error))
      throw new ApiError('Rruga nuk u ruajt plotësisht.', 503);
    return {
      stops: ordered.map((shipment, index) => ({
        ...shipment,
        routeOrder: index + 1,
      })),
    };
  },
};
