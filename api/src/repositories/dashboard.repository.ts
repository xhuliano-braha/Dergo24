import { getSupabaseAdmin } from '../lib/supabase-admin';

export const dashboardRepository = {
  async staff(staffId: string, courier: boolean) {
    const supabase = getSupabaseAdmin();
    let shipmentsQuery = supabase
      .from('shipments')
      .select(
        'id, tracking_code, sender_name, sender_phone, recipient_name, recipient_phone, pickup_city, delivery_city, delivery_address, package_type, weight_kg, service, status, quoted_price_all, cod_amount_all, cod_status, driver_id, pickup_date, delivery_window, delivery_method, pickup_point_id, address_validated, route_order, created_at, drivers(full_name), pickup_points(name, address), delivery_proofs(recipient_name, delivered_at, cod_collected_all)',
      )
      .order('created_at', { ascending: false })
      .limit(200);

    if (courier) {
      const { data: driver } = await supabase
        .from('drivers')
        .select('id')
        .eq('staff_id', staffId)
        .eq('active', true)
        .maybeSingle();
      shipmentsQuery = shipmentsQuery.eq(
        'driver_id',
        driver?.id ?? crypto.randomUUID(),
      );
    }

    const [
      shipmentsResult,
      quotesResult,
      driversResult,
      staffResult,
      claimsResult,
      ratingsResult,
      pointsResult,
      customersResult,
      authUsersResult,
    ] = await Promise.all([
      shipmentsQuery,
      supabase
        .from('quote_requests')
        .select(
          'id, reference_code, customer_name, phone, pickup_city, delivery_city, item_type, description, status, quoted_price_all, created_at',
        )
        .order('created_at', { ascending: false })
        .limit(200),
      supabase
        .from('drivers')
        .select('id, full_name, phone, status, active, staff_id, created_at')
        .order('full_name'),
      supabase
        .from('staff_profiles')
        .select('id, full_name, email, roles!inner(name), active, created_at')
        .order('full_name'),
      supabase
        .from('claims')
        .select(
          'id, shipment_id, claim_type, description, requested_refund_all, approved_refund_all, status, staff_notes, created_at, shipments!claims_shipment_id_fkey(tracking_code, recipient_name)',
        )
        .order('created_at', { ascending: false }),
      supabase
        .from('delivery_ratings')
        .select(
          'id, driver_id, rating, comment, created_at, drivers(full_name), shipments!delivery_ratings_shipment_id_fkey(tracking_code)',
        )
        .order('created_at', { ascending: false }),
      supabase
        .from('pickup_points')
        .select('id, name, city, address, opening_hours, active')
        .order('city'),
      supabase
        .from('customer_profiles')
        .select('id, full_name, email, phone, active, created_at')
        .order('created_at', { ascending: false })
        .limit(300),
      supabase.auth.admin.listUsers({ perPage: 1000 }),
    ]);

    return {
      shipmentsResult,
      quotesResult,
      driversResult,
      staffResult,
      claimsResult,
      ratingsResult,
      pointsResult,
      customersResult,
      authUsersResult,
    };
  },
  customer(customerId: string) {
    return getSupabaseAdmin()
      .from('shipments')
      .select(
        'id, tracking_code, recipient_name, pickup_city, delivery_city, delivery_address, package_type, weight_kg, service, status, quoted_price_all, cod_amount_all, cod_status, pickup_date, delivery_window, delivery_method, pickup_points(name, address, opening_hours), created_at, tracking_events(status, location, details, latitude, longitude, created_at), delivery_proofs(recipient_name, delivered_at, cod_collected_all), claims:claims!claims_shipment_id_fkey(id, claim_type, description, requested_refund_all, approved_refund_all, status, staff_notes, created_at), delivery_ratings:delivery_ratings!delivery_ratings_shipment_id_fkey(rating, comment)',
      )
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });
  },
};
