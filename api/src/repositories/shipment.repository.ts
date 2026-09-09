import { getSupabaseAdmin } from '../lib/supabase-admin';

export const shipmentRepository = {
  findByTrackingCode(trackingCode: string) {
    return getSupabaseAdmin()
      .from('shipments')
      .select(
        'id, tracking_code, pickup_city, delivery_city, status, service, created_at',
      )
      .eq('tracking_code', trackingCode)
      .maybeSingle();
  },

  findTrackingEvents(shipmentId: string) {
    return getSupabaseAdmin()
      .from('tracking_events')
      .select('status, created_at')
      .eq('shipment_id', shipmentId)
      .order('created_at', { ascending: false });
  },

  bookAtomic(
    shipments: Record<string, unknown>[],
    events: Record<string, unknown>[],
    actorId: string | null,
  ) {
    return getSupabaseAdmin().rpc('book_shipments_atomic', {
      p_shipments: shipments,
      p_events: events,
      p_actor: actorId,
    });
  },

  findForUpdate(shipmentId: string) {
    return getSupabaseAdmin()
      .from('shipments')
      .select('driver_id, cod_status')
      .eq('id', shipmentId)
      .maybeSingle();
  },

  findDriverByStaffId(staffId: string) {
    return getSupabaseAdmin()
      .from('drivers')
      .select('id')
      .eq('staff_id', staffId)
      .maybeSingle();
  },

  updateAtomic(
    shipmentId: string,
    input: Record<string, unknown>,
    actorId: string,
  ) {
    return getSupabaseAdmin().rpc('update_shipment_atomic', {
      p_shipment_id: shipmentId,
      p_actor: actorId,
      p_input: input,
    });
  },
};
