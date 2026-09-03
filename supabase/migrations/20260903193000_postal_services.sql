create table public.pickup_points (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null,
  address text not null,
  opening_hours text not null,
  latitude double precision,
  longitude double precision,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.pickup_points (name, city, address, opening_hours)
values ('Dergo24 Cassa Italia', 'Tiranë', 'Rruga Mikel Maruli, pranë Cassa Italia', 'Hënë – Shtunë, 08:00 – 20:00');

alter table public.shipments
  add column pickup_date date,
  add column delivery_window text not null default 'anytime'
    check (delivery_window in ('anytime', '09:00-13:00', '13:00-17:00', '17:00-20:00')),
  add column delivery_method text not null default 'home'
    check (delivery_method in ('home', 'pickup_point')),
  add column pickup_point_id uuid references public.pickup_points(id) on delete set null,
  add column address_validated boolean not null default false,
  add column route_order integer check (route_order is null or route_order > 0);

create table public.claims (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  customer_id uuid not null references public.customer_profiles(id) on delete cascade,
  claim_type text not null check (claim_type in ('damaged', 'lost', 'delayed', 'other')),
  description text not null,
  requested_refund_all integer not null default 0 check (requested_refund_all >= 0),
  approved_refund_all integer check (approved_refund_all is null or approved_refund_all >= 0),
  status text not null default 'new' check (status in ('new', 'reviewing', 'approved', 'rejected', 'refunded')),
  staff_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.delivery_ratings (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null unique references public.shipments(id) on delete cascade,
  customer_id uuid not null references public.customer_profiles(id) on delete cascade,
  driver_id uuid not null references public.drivers(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

create index idx_shipments_pickup_date on public.shipments(pickup_date, driver_id, route_order);
create index idx_claims_status_created on public.claims(status, created_at desc);
create index idx_delivery_ratings_driver on public.delivery_ratings(driver_id, created_at desc);

alter table public.pickup_points enable row level security;
alter table public.claims enable row level security;
alter table public.delivery_ratings enable row level security;

grant select, insert, update, delete on table public.pickup_points to service_role;
grant select, insert, update, delete on table public.claims to service_role;
grant select, insert, update, delete on table public.delivery_ratings to service_role;
grant select, update on table public.shipments to service_role;
