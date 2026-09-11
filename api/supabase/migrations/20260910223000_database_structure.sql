begin;

-- Keep timestamps correct for every write path (API, SQL editor, or future jobs).
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists shipments_set_updated_at on public.shipments;
create trigger shipments_set_updated_at
before update on public.shipments
for each row execute function public.set_updated_at();

drop trigger if exists quote_requests_set_updated_at on public.quote_requests;
create trigger quote_requests_set_updated_at
before update on public.quote_requests
for each row execute function public.set_updated_at();

drop trigger if exists claims_set_updated_at on public.claims;
create trigger claims_set_updated_at
before update on public.claims
for each row execute function public.set_updated_at();

-- Checks apply immediately to new and changed rows. NOT VALID keeps the
-- migration safe when upgrading a database that may contain legacy data.
alter table public.vehicles
  add constraint vehicles_capacity_positive
  check (capacity_kg is null or capacity_kg > 0) not valid;

alter table public.pickup_points
  add constraint pickup_points_latitude_range
    check (latitude is null or latitude between -90 and 90) not valid,
  add constraint pickup_points_longitude_range
    check (longitude is null or longitude between -180 and 180) not valid;

alter table public.shipments
  add constraint shipments_cod_state_consistent
    check (
      (cod_amount_all = 0 and cod_status = 'not_required')
      or (cod_amount_all > 0 and cod_status in ('pending', 'collected', 'settled'))
    ) not valid,
  add constraint shipments_pickup_point_required
    check (delivery_method <> 'pickup_point' or pickup_point_id is not null) not valid;

-- PostgreSQL does not automatically index the referencing side of foreign keys.
-- These indexes support joins, dashboard filters, and parent-row deletion.
create index if not exists idx_staff_audit_logs_actor_id
  on public.staff_audit_logs(actor_id) where actor_id is not null;
create index if not exists idx_vehicles_driver_id
  on public.vehicles(driver_id) where driver_id is not null;
create index if not exists idx_tracking_events_created_by
  on public.tracking_events(created_by) where created_by is not null;
create index if not exists idx_quote_requests_assigned_to
  on public.quote_requests(assigned_to) where assigned_to is not null;
create index if not exists idx_delivery_proofs_recorded_by
  on public.delivery_proofs(recorded_by) where recorded_by is not null;
create index if not exists idx_claims_shipment_id
  on public.claims(shipment_id);
create index if not exists idx_claims_customer_id
  on public.claims(customer_id);
create index if not exists idx_delivery_ratings_customer_id
  on public.delivery_ratings(customer_id);

-- Descriptions are visible in Supabase and PostgreSQL inspection tools.
comment on table public.staff_profiles is 'Application staff identities and their assigned role.';
comment on table public.staff_audit_logs is 'Immutable audit trail for staff access and role permission changes.';
comment on table public.roles is 'Named staff roles used by role-based access control.';
comment on table public.permissions is 'Atomic capabilities assignable to staff roles.';
comment on table public.role_permissions is 'Many-to-many mapping between roles and permissions.';
comment on table public.customer_profiles is 'Customer identity and legal-consent profile data.';
comment on table public.drivers is 'Courier operational records, optionally linked one-to-one to staff identities.';
comment on table public.vehicles is 'Delivery vehicles and their current driver assignment.';
comment on table public.shipments is 'Primary parcel record, assignment, price, COD, and delivery state.';
comment on table public.tracking_events is 'Append-only shipment tracking timeline.';
comment on table public.quote_requests is 'Customer requests for non-standard delivery quotes.';
comment on table public.delivery_proofs is 'One delivery confirmation, signature, and optional photo per shipment.';
comment on table public.pickup_points is 'Active customer collection locations.';
comment on table public.claims is 'Customer claims associated with shipments.';
comment on table public.delivery_ratings is 'One customer delivery rating per shipment.';
comment on table public.request_limits is 'Short-lived request counters used for server-side throttling.';
comment on table public.auth_generations is 'Per-user session generation used to invalidate all sessions.';
comment on table public.app_sessions is 'Hashed, expiring application sessions for staff and customers.';

comment on column public.shipments.quoted_price_all is 'Quoted delivery price in Albanian lek (ALL), stored as a whole integer.';
comment on column public.shipments.cod_amount_all is 'Cash-on-delivery amount in Albanian lek (ALL), stored as a whole integer.';
comment on column public.delivery_proofs.cod_collected_all is 'COD amount collected at delivery in Albanian lek (ALL).';
comment on column public.claims.requested_refund_all is 'Refund requested in Albanian lek (ALL).';
comment on column public.claims.approved_refund_all is 'Refund approved in Albanian lek (ALL), or null before a decision.';
comment on column public.delivery_proofs.signature_data is 'Sanitized PNG signature encoded as a data URL.';
comment on column public.delivery_proofs.photo_path is 'Private delivery-proofs bucket object path; never a public URL.';

revoke all on function public.set_updated_at() from public, anon, authenticated;
grant execute on function public.set_updated_at() to service_role;

notify pgrst, 'reload schema';
commit;
