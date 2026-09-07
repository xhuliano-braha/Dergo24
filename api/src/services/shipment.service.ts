import type { output } from 'zod';
import { ApiError } from '../errors/api-error';
import { validateAlbanianAddress } from '../lib/albania-address';
import {
  calculatePrice,
  createTrackingCode,
  type ShipmentInput,
} from '../lib/shipments';
import type { StaffProfile } from '../types/profiles';
import { shipmentUpdateSchema } from '../lib/staff-schemas';
import { shipmentRepository } from '../repositories/shipment.repository';
import { atomicWriteError } from '../errors/atomic-write-error';

type ShipmentUpdateInput = output<typeof shipmentUpdateSchema>;

const initialStatus = 'Porosia u regjistrua';
const deliveredStatus = shipmentUpdateSchema.shape.status.options[5];

function prepareShipment(
  input: ShipmentInput,
  customerId: string | null,
  createdAt: string,
) {
  const address = validateAlbanianAddress(input.deliveryCity, input.address);
  if (!address.valid) throw new ApiError(address.message, 400);
  if (input.deliveryMethod === 'pickup_point' && !input.pickupPointId)
    throw new ApiError('Zgjidhni pikën e tërheqjes.', 400);

  const id = crypto.randomUUID();
  const trackingCode = createTrackingCode();
  const price = calculatePrice(input.weight, input.service);
  return {
    shipment: {
      id,
      tracking_code: trackingCode,
      sender_name: input.senderName,
      sender_phone: input.senderPhone,
      recipient_name: input.recipientName,
      recipient_phone: input.recipientPhone,
      pickup_city: input.pickupCity,
      delivery_city: address.city,
      delivery_address: address.address,
      package_type: input.packageType,
      weight_kg: input.weight,
      service: input.service,
      status: initialStatus,
      customer_id: customerId,
      quoted_price_all: price,
      cod_amount_all: input.codAmount,
      cod_status: input.codAmount > 0 ? 'pending' : 'not_required',
      pickup_date: input.pickupDate,
      delivery_window: input.deliveryWindow,
      delivery_method: input.deliveryMethod,
      pickup_point_id: input.pickupPointId,
      address_validated: true,
      created_at: createdAt,
      updated_at: createdAt,
    },
    trackingCode,
    price,
  };
}

export const shipmentService = {
  async track(trackingCode: string) {
    const normalizedCode = trackingCode.trim().toUpperCase();
    if (!normalizedCode) throw new ApiError('Vendosni kodin e gjurmimit.', 400);

    const { data: shipment, error: shipmentError } =
      await shipmentRepository.findByTrackingCode(normalizedCode);
    if (shipmentError)
      throw new ApiError(
        'Shërbimi i gjurmimit nuk është përkohësisht i disponueshëm.',
        503,
      );
    if (!shipment)
      throw new ApiError('Nuk u gjet asnjë dërgesë me këtë kod.', 404);

    const { data: events, error: eventsError } =
      await shipmentRepository.findTrackingEvents(shipment.id);
    if (eventsError)
      throw new ApiError(
        'Shërbimi i gjurmimit nuk është përkohësisht i disponueshëm.',
        503,
      );

    return {
      shipment: {
        trackingCode: shipment.tracking_code,
        pickupCity: shipment.pickup_city,
        deliveryCity: shipment.delivery_city,
        status: shipment.status,
        service: shipment.service,
        createdAt: shipment.created_at,
      },
      events: (events ?? []).map((event) => ({
        status: event.status,
        location: event.location,
        details: event.details,
        latitude: event.latitude,
        longitude: event.longitude,
        createdAt: event.created_at,
      })),
    };
  },

  async create(input: ShipmentInput, customerId: string | null) {
    const createdAt = new Date().toISOString();
    const prepared = prepareShipment(input, customerId, createdAt);
    const event = {
      id: crypto.randomUUID(),
      shipment_id: prepared.shipment.id,
      status: initialStatus,
      location: input.pickupCity,
      details:
        'Kërkesa u pranua. Korrieri do t’ju kontaktojë për marrjen e dërgesës.',
      created_at: createdAt,
    };
    const { error } = await shipmentRepository.bookAtomic(
      [prepared.shipment],
      [event],
      null,
    );
    if (error)
      throw atomicWriteError(
        error,
        'Rezervimi nuk mund të ruhej. Provoni përsëri.',
      );

    return {
      trackingCode: prepared.trackingCode,
      price: prepared.price,
      status: initialStatus,
      createdAt,
    };
  },

  async importMany(inputs: ShipmentInput[], staff: StaffProfile) {
    if (!['admin', 'dispatcher'].includes(staff.role))
      throw new ApiError('Nuk keni leje për import.', 403);

    const createdAt = new Date().toISOString();
    const prepared = inputs.map((input) => {
      try {
        return { input, ...prepareShipment(input, null, createdAt) };
      } catch (error) {
        if (error instanceof ApiError)
          throw new ApiError(
            `${input.recipientName}: ${error.message}`,
            error.status,
          );
        throw error;
      }
    });
    const shipments = prepared.map((item) => item.shipment);
    const events = prepared.map((item) => ({
      id: crypto.randomUUID(),
      shipment_id: item.shipment.id,
      status: initialStatus,
      location: item.input.pickupCity,
      details: 'Dërgesa u importua nga paneli i biznesit.',
      created_by: staff.id,
      created_at: createdAt,
    }));

    const { error } = await shipmentRepository.bookAtomic(
      shipments,
      events,
      staff.id,
    );
    if (error) throw atomicWriteError(error, 'Dërgesat nuk u importuan.');

    return {
      imported: shipments.length,
      trackingCodes: prepared.map((item) => item.trackingCode),
    };
  },

  async update(
    shipmentId: string,
    input: ShipmentUpdateInput,
    staff: StaffProfile,
  ) {
    const { data: currentShipment, error: currentShipmentError } =
      await shipmentRepository.findForUpdate(shipmentId);
    if (currentShipmentError)
      throw new ApiError('Dërgesa nuk mund të ngarkohej.', 503);
    if (!currentShipment) throw new ApiError('Dërgesa nuk u gjet.', 404);

    if (staff.role === 'courier') {
      const { data: driver } = await shipmentRepository.findDriverByStaffId(
        staff.id,
      );
      if (!driver || currentShipment.driver_id !== driver.id)
        throw new ApiError('Nuk keni akses në këtë dërgesë.', 403);
      if (input.status === deliveredStatus)
        throw new ApiError('Përdorni konfirmimin me firmë për dorëzimin.', 400);
    }

    if (input.status === deliveredStatus)
      throw new ApiError('Përdorni konfirmimin me firmë për dorëzimin.', 400);
    const { error } = await shipmentRepository.updateAtomic(
      shipmentId,
      input,
      staff.id,
    );
    if (error)
      throw atomicWriteError(error, 'Dërgesa nuk mund të përditësohej.');

    return { success: true };
  },
};
