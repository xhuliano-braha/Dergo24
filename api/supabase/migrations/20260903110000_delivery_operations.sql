alter table public.staff_profiles
  drop constraint staff_profiles_role_check;

alter table public.staff_profiles
  add constraint staff_profiles_role_check
  check (role in ('admin', 'dispatcher', 'support', 'courier'));

alter table public.drivers
  add column staff_id uuid unique references public.staff_profiles(id) on delete set null;

alter table public.shipments
  add column cod_amount_all integer not null default 0 check (cod_amount_all >= 0),
  add column cod_status text not null default 'not_required'
    check (cod_status in ('not_required', 'pending', 'collected', 'settled'));

create table public.delivery_proofs (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null unique references public.shipments(id) on delete cascade,
  recipient_name text not null,
  signature_data text not null,
  photo_path text,
  notes text,
  cod_collected_all integer not null default 0 check (cod_collected_all >= 0),
  latitude double precision check (latitude is null or latitude between -90 and 90),
  longitude double precision check (longitude is null or longitude between -180 and 180),
  recorded_by uuid references public.staff_profiles(id) on delete set null,
  delivered_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index idx_delivery_proofs_delivered_at
  on public.delivery_proofs(delivered_at desc);

alter table public.delivery_proofs enable row level security;
grant select, insert, update, delete on table public.delivery_proofs to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'delivery-proofs',
  'delivery-proofs',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;
