begin;

-- Application profiles are extensions of Supabase Auth identities.  NOT VALID
-- allows an existing installation to be upgraded before orphaned legacy rows
-- are reconciled, while still enforcing the relationship for every new row.
alter table public.customer_profiles
  add constraint customer_profiles_auth_user_fkey
  foreign key (id) references auth.users(id) on delete cascade not valid;

alter table public.staff_profiles
  add constraint staff_profiles_auth_user_fkey
  foreign key (id) references auth.users(id) on delete cascade not valid;

-- UUID generation belongs in the database as well as the API. This makes
-- imports, maintenance jobs, and future integrations use the same identity
-- strategy without requiring callers to manufacture primary keys.
alter table public.shipments
  alter column id set default gen_random_uuid();
alter table public.tracking_events
  alter column id set default gen_random_uuid();
alter table public.quote_requests
  alter column id set default gen_random_uuid();

-- Every mutable entity receives a database-maintained modification time.
alter table public.customer_profiles
  add column updated_at timestamptz not null default now();
alter table public.staff_profiles
  add column updated_at timestamptz not null default now();
alter table public.drivers
  add column updated_at timestamptz not null default now();
alter table public.vehicles
  add column updated_at timestamptz not null default now();
alter table public.pickup_points
  add column updated_at timestamptz not null default now();

create trigger customer_profiles_set_updated_at
before update on public.customer_profiles
for each row execute function public.set_updated_at();

create trigger staff_profiles_set_updated_at
before update on public.staff_profiles
for each row execute function public.set_updated_at();

create trigger drivers_set_updated_at
before update on public.drivers
for each row execute function public.set_updated_at();

create trigger vehicles_set_updated_at
before update on public.vehicles
for each row execute function public.set_updated_at();

create trigger pickup_points_set_updated_at
before update on public.pickup_points
for each row execute function public.set_updated_at();

-- A driver login may only point at a courier account. Application validation
-- provides a friendly message; this trigger protects imports and direct SQL.
create or replace function public.enforce_driver_staff_role()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.staff_id is not null and not exists (
    select 1
    from public.staff_profiles staff
    join public.roles role on role.id = staff.role_id
    where staff.id = new.staff_id and staff.active and role.name = 'courier'
  ) then
    raise sqlstate '23514' using message = 'Driver staff account must be an active courier';
  end if;
  return new;
end;
$$;

create trigger drivers_enforce_staff_role
before insert or update of staff_id on public.drivers
for each row execute function public.enforce_driver_staff_role();

create or replace function public.protect_linked_courier_role()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.role_id is distinct from old.role_id
    and exists (select 1 from public.drivers where staff_id = old.id)
    and not exists (
      select 1 from public.roles where id = new.role_id and name = 'courier'
    ) then
    raise sqlstate '23514' using message = 'Unlink the driver before changing the courier role';
  end if;
  return new;
end;
$$;

create trigger staff_profiles_protect_linked_courier_role
before update of role_id on public.staff_profiles
for each row execute function public.protect_linked_courier_role();

revoke all on function public.enforce_driver_staff_role(),
  public.protect_linked_courier_role() from public, anon, authenticated;

-- Claims and ratings are customer-owned records. A pair-wise foreign key
-- prevents a valid customer and a valid shipment from being combined when
-- that shipment belongs to someone else.
alter table public.shipments
  add constraint shipments_id_customer_id_key unique (id, customer_id),
  add constraint shipments_id_customer_driver_id_key unique (id, customer_id, driver_id);

alter table public.claims
  add constraint claims_shipment_customer_fkey
  foreign key (shipment_id, customer_id)
  references public.shipments(id, customer_id)
  on update restrict on delete cascade not valid;

alter table public.delivery_ratings
  add constraint delivery_ratings_shipment_customer_driver_fkey
  foreign key (shipment_id, customer_id, driver_id)
  references public.shipments(id, customer_id, driver_id)
  on update restrict on delete cascade not valid;

-- Baseline data-quality rules. They are intentionally NOT VALID during the
-- upgrade: PostgreSQL checks all future inserts/updates, and legacy rows can be
-- audited and validated in a controlled follow-up operation.
alter table public.customer_profiles
  add constraint customer_profiles_name_not_blank
    check (length(btrim(full_name)) between 2 and 120) not valid,
  add constraint customer_profiles_email_canonical
    check (email = lower(btrim(email)) and position('@' in email) > 1) not valid,
  add constraint customer_profiles_phone_not_blank
    check (length(btrim(phone)) between 7 and 32) not valid;

alter table public.staff_profiles
  add constraint staff_profiles_name_not_blank
    check (length(btrim(full_name)) between 2 and 120) not valid,
  add constraint staff_profiles_email_canonical
    check (email = lower(btrim(email)) and position('@' in email) > 1) not valid;

alter table public.drivers
  add constraint drivers_name_not_blank
    check (length(btrim(full_name)) between 2 and 120) not valid,
  add constraint drivers_phone_not_blank
    check (length(btrim(phone)) between 7 and 32) not valid;

alter table public.shipments
  add constraint shipments_tracking_code_not_blank
    check (length(btrim(tracking_code)) between 6 and 64) not valid,
  add constraint shipments_contact_names_not_blank
    check (
      length(btrim(sender_name)) between 2 and 120
      and length(btrim(recipient_name)) between 2 and 120
    ) not valid,
  add constraint shipments_contact_phones_not_blank
    check (
      length(btrim(sender_phone)) between 7 and 32
      and length(btrim(recipient_phone)) between 7 and 32
    ) not valid,
  add constraint shipments_home_address_required
    check (delivery_method <> 'home' or length(btrim(delivery_address)) >= 5) not valid,
  add constraint shipments_assignment_consistent
    check (vehicle_id is null or driver_id is not null) not valid;

alter table public.claims
  add constraint claims_refund_decision_consistent
    check (
      (status in ('new', 'reviewing', 'rejected') and approved_refund_all is null)
      or (status in ('approved', 'refunded') and approved_refund_all is not null)
    ) not valid;

-- Support the new ownership foreign keys and the common operational queues.
create index if not exists idx_claims_customer_shipment
  on public.claims(customer_id, shipment_id);
create index if not exists idx_delivery_ratings_customer_shipment_driver
  on public.delivery_ratings(customer_id, shipment_id, driver_id);
create index if not exists idx_shipments_unassigned_queue
  on public.shipments(created_at)
  where driver_id is null;
create index if not exists idx_shipments_tracking_code_lower
  on public.shipments(lower(tracking_code));

-- Tracking and staff audit rows are facts, not editable application state.
-- Privileges enforce append-only behavior for the service role used by the API.
revoke update, delete on table public.tracking_events from service_role;
revoke update, delete on table public.staff_audit_logs from service_role;

comment on constraint claims_shipment_customer_fkey on public.claims is
  'Guarantees that a claim is filed by the customer who owns the shipment.';
comment on constraint delivery_ratings_shipment_customer_driver_fkey on public.delivery_ratings is
  'Guarantees rating ownership and preserves the driver who completed the shipment.';
comment on column public.customer_profiles.updated_at is 'Database-maintained last modification time.';
comment on column public.staff_profiles.updated_at is 'Database-maintained last modification time.';
comment on column public.drivers.updated_at is 'Database-maintained last modification time.';
comment on column public.vehicles.updated_at is 'Database-maintained last modification time.';
comment on column public.pickup_points.updated_at is 'Database-maintained last modification time.';

notify pgrst, 'reload schema';
commit;
