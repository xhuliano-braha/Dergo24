create table public.staff_profiles (
  id uuid primary key,
  full_name text not null,
  email text not null unique,
  role text not null check (role in ('admin', 'dispatcher', 'support')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.drivers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null unique,
  status text not null default 'available' check (status in ('available', 'assigned', 'off_duty')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  registration_number text not null unique,
  vehicle_type text not null,
  capacity_kg numeric(10,2),
  driver_id uuid references public.drivers(id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.shipments (
  id uuid primary key,
  tracking_code text not null unique,
  sender_name text not null,
  sender_phone text not null,
  recipient_name text not null,
  recipient_phone text not null,
  pickup_city text not null,
  delivery_city text not null,
  delivery_address text not null,
  package_type text not null,
  weight_kg numeric(10,2) not null check (weight_kg > 0),
  service text not null check (service in ('standard', 'express')),
  status text not null,
  quoted_price_all integer not null check (quoted_price_all >= 0),
  driver_id uuid references public.drivers(id) on delete set null,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tracking_events (
  id uuid primary key,
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  status text not null,
  location text not null,
  details text not null,
  created_by uuid references public.staff_profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.quote_requests (
  id uuid primary key,
  reference_code text not null unique,
  customer_name text not null,
  phone text not null,
  pickup_city text not null,
  delivery_city text not null,
  item_type text not null,
  description text not null,
  status text not null default 'new' check (status in ('new', 'contacted', 'quoted', 'accepted', 'declined')),
  assigned_to uuid references public.staff_profiles(id) on delete set null,
  quoted_price_all integer check (quoted_price_all >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_shipments_status_created_at on public.shipments(status, created_at desc);
create index idx_shipments_driver_status on public.shipments(driver_id, status) where driver_id is not null;
create index idx_tracking_events_shipment_created on public.tracking_events(shipment_id, created_at desc);
create index idx_quote_requests_status_created on public.quote_requests(status, created_at desc);

alter table public.staff_profiles enable row level security;
alter table public.drivers enable row level security;
alter table public.vehicles enable row level security;
alter table public.shipments enable row level security;
alter table public.tracking_events enable row level security;
alter table public.quote_requests enable row level security;
