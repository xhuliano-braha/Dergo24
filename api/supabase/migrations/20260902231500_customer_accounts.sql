create table public.customer_profiles (
  id uuid primary key,
  full_name text not null,
  email text not null unique,
  phone text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.shipments
  add column customer_id uuid references public.customer_profiles(id) on delete set null;

create index idx_shipments_customer_created
  on public.shipments(customer_id, created_at desc)
  where customer_id is not null;

alter table public.customer_profiles enable row level security;

grant select, insert, update, delete on table public.customer_profiles to service_role;
grant select, insert, update, delete on table public.shipments to service_role;
