import { getSupabaseAdmin } from '../lib/supabase-admin';

export const postalRepository = {
  createDriver(values: { full_name: string; phone: string }) {
    return getSupabaseAdmin().from('drivers').insert(values);
  },
  updateDriver(
    id: string,
    values: { status: string; active: boolean; staff_id: string | null },
  ) {
    return getSupabaseAdmin()
      .from('drivers')
      .update(values)
      .eq('id', id)
      .select('id')
      .maybeSingle();
  },
  createQuote(values: {
    id: string;
    reference_code: string;
    customer_name: string;
    phone: string;
    pickup_city: string;
    delivery_city: string;
    item_type: string;
    description: string;
    status: string;
  }) {
    return getSupabaseAdmin().from('quote_requests').insert(values);
  },
  updateQuote(
    id: string,
    values: {
      status: string;
      quoted_price_all: number | null;
      assigned_to: string;
      updated_at: string;
    },
  ) {
    return getSupabaseAdmin()
      .from('quote_requests')
      .update(values)
      .eq('id', id)
      .select('id')
      .maybeSingle();
  },
  findCustomerShipment(id: string, customerId: string) {
    return getSupabaseAdmin()
      .from('shipments')
      .select('id, driver_id, status')
      .eq('id', id)
      .eq('customer_id', customerId)
      .maybeSingle();
  },
  createClaim(values: {
    shipment_id: string;
    customer_id: string;
    claim_type: string;
    description: string;
    requested_refund_all: number;
  }) {
    return getSupabaseAdmin().from('claims').insert(values);
  },
  updateClaim(
    id: string,
    values: {
      status: string;
      approved_refund_all: number | null;
      staff_notes: string | null;
      updated_at: string;
    },
  ) {
    return getSupabaseAdmin()
      .from('claims')
      .update(values)
      .eq('id', id)
      .select('id')
      .maybeSingle();
  },
  saveRating(values: {
    shipment_id: string;
    customer_id: string;
    driver_id: string;
    rating: number;
    comment: string | null;
  }) {
    return getSupabaseAdmin()
      .from('delivery_ratings')
      .upsert(values, { onConflict: 'shipment_id' });
  },
  listPickupPoints() {
    return getSupabaseAdmin()
      .from('pickup_points')
      .select('id, name, city, address, opening_hours')
      .eq('active', true)
      .order('city');
  },
  createPickupPoint(values: {
    name: string;
    city: string;
    address: string;
    opening_hours: string;
  }) {
    return getSupabaseAdmin().from('pickup_points').insert(values);
  },
};
