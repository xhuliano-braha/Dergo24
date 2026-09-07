import { getSupabaseAdmin } from '../lib/supabase-admin';

export const deliveryRepository = {
  findShipment(id: string) {
    return getSupabaseAdmin()
      .from('shipments')
      .select(
        'id, driver_id, delivery_city, cod_amount_all, cod_status, status',
      )
      .eq('id', id)
      .maybeSingle();
  },
  findDriver(staffId: string) {
    return getSupabaseAdmin()
      .from('drivers')
      .select('id')
      .eq('staff_id', staffId)
      .eq('active', true)
      .maybeSingle();
  },
  label(id: string, driverId: string | null) {
    let query = getSupabaseAdmin()
      .from('shipments')
      .select(
        'id, tracking_code, sender_name, sender_phone, recipient_name, recipient_phone, pickup_city, delivery_city, delivery_address, package_type, weight_kg, service, cod_amount_all, quoted_price_all, pickup_date, delivery_window, delivery_method, pickup_points(name, address), created_at',
      )
      .eq('id', id);
    if (driverId) query = query.eq('driver_id', driverId);
    return query.maybeSingle();
  },
  settle(id: string) {
    return getSupabaseAdmin()
      .from('shipments')
      .update({ cod_status: 'settled', updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('cod_status', 'collected')
      .select('id')
      .maybeSingle();
  },
  proof(id: string) {
    return getSupabaseAdmin()
      .from('delivery_proofs')
      .select(
        'recipient_name, signature_data, photo_path, notes, cod_collected_all, latitude, longitude, delivered_at',
      )
      .eq('shipment_id', id)
      .maybeSingle();
  },
  signPhoto(path: string) {
    return getSupabaseAdmin()
      .storage.from('delivery-proofs')
      .createSignedUrl(path, 900);
  },
  uploadPhoto(path: string, photo: File) {
    return getSupabaseAdmin()
      .storage.from('delivery-proofs')
      .upload(path, photo, { contentType: photo.type, upsert: false });
  },
  confirmAtomic(
    id: string,
    actorId: string,
    proof: {
      recipient_name: string;
      signature_data: string;
      photo_path: string | null;
      notes: string | null;
      cod_collected_all: number;
      latitude: number | null;
      longitude: number | null;
    },
  ) {
    return getSupabaseAdmin().rpc('confirm_delivery_atomic', {
      p_shipment_id: id,
      p_actor: actorId,
      p_proof: proof,
    });
  },
  routeStops(driverId: string, pickupDate: string) {
    return getSupabaseAdmin()
      .from('shipments')
      .select(
        'id, tracking_code, delivery_city, delivery_address, delivery_window, service, created_at',
      )
      .eq('driver_id', driverId)
      .eq('pickup_date', pickupDate)
      .not('status', 'in', '("U dorëzua","U anulua")');
  },
  setRouteOrder(id: string, order: number) {
    return getSupabaseAdmin()
      .from('shipments')
      .update({ route_order: order })
      .eq('id', id);
  },
};
