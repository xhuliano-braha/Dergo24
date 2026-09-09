begin;

create table public.staff_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.staff_profiles(id) on delete set null,
  action text not null check (action in ('staff.access_updated', 'role.permissions_updated')),
  target_type text not null check (target_type in ('staff', 'role')),
  target_id text not null,
  changes jsonb not null,
  created_at timestamptz not null default now()
);

create index staff_audit_logs_created_at_idx
  on public.staff_audit_logs(created_at desc);

create or replace function public.set_role_permissions_atomic(
  p_role_id integer,
  p_permissions text[],
  p_actor uuid
) returns void
language plpgsql security invoker set search_path = ''
as $$
declare
  role_name text;
  old_permissions jsonb;
  new_permissions jsonb;
begin
  if not public.staff_has_permission(p_actor, 'staff.manage') then
    raise sqlstate 'PT403' using message = 'Permission management denied';
  end if;
  select name into role_name from public.roles where id = p_role_id for update;
  if role_name is null then
    raise sqlstate 'PT404' using message = 'Role not found';
  end if;
  if exists (
    select permission_code from unnest(coalesce(p_permissions, array[]::text[])) permission_code
    except select code from public.permissions
  ) then
    raise sqlstate 'PT400' using message = 'Unknown permission';
  end if;
  if role_name = 'admin' and not ('staff.manage' = any(coalesce(p_permissions, array[]::text[]))) then
    raise sqlstate 'PT400' using message = 'Admin must retain staff.manage';
  end if;

  select coalesce(jsonb_agg(permission.code order by permission.code), '[]'::jsonb)
    into old_permissions
  from public.role_permissions role_permission
  join public.permissions permission on permission.id = role_permission.permission_id
  where role_permission.role_id = p_role_id;

  delete from public.role_permissions where role_id = p_role_id;
  insert into public.role_permissions(role_id, permission_id)
  select p_role_id, permission.id
  from public.permissions permission
  where permission.code = any(coalesce(p_permissions, array[]::text[]));

  select coalesce(jsonb_agg(permission.code order by permission.code), '[]'::jsonb)
    into new_permissions
  from public.role_permissions role_permission
  join public.permissions permission on permission.id = role_permission.permission_id
  where role_permission.role_id = p_role_id;

  insert into public.staff_audit_logs(actor_id, action, target_type, target_id, changes)
  values (
    p_actor,
    'role.permissions_updated',
    'role',
    p_role_id::text,
    jsonb_build_object('role', role_name, 'before', old_permissions, 'after', new_permissions)
  );
end;
$$;

create or replace function public.update_staff_access_atomic(
  p_target uuid,
  p_role_id integer,
  p_active boolean,
  p_actor uuid
) returns void
language plpgsql security invoker set search_path = ''
as $$
declare
  old_staff public.staff_profiles%rowtype;
  new_role_name text;
begin
  if not public.staff_has_permission(p_actor, 'staff.manage') then
    raise sqlstate 'PT403' using message = 'Staff management denied';
  end if;
  select * into old_staff from public.staff_profiles where id = p_target for update;
  if not found then raise sqlstate 'PT404' using message = 'Staff not found'; end if;
  select name into new_role_name from public.roles where id = p_role_id;
  if new_role_name is null then raise sqlstate 'PT400' using message = 'Role not found'; end if;
  if p_target = p_actor and (not p_active or new_role_name <> 'admin') then
    raise sqlstate 'PT400' using message = 'Cannot remove your own administrative access';
  end if;

  update public.staff_profiles set role_id = p_role_id, active = p_active where id = p_target;
  insert into public.staff_audit_logs(actor_id, action, target_type, target_id, changes)
  values (
    p_actor,
    'staff.access_updated',
    'staff',
    p_target::text,
    jsonb_build_object(
      'before', jsonb_build_object('role_id', old_staff.role_id, 'active', old_staff.active),
      'after', jsonb_build_object('role_id', p_role_id, 'active', p_active)
    )
  );
end;
$$;

alter table public.staff_audit_logs enable row level security;
revoke all on public.staff_audit_logs from public, anon, authenticated;
grant select, insert on public.staff_audit_logs to service_role;
revoke all on function public.set_role_permissions_atomic(integer, text[], uuid),
  public.update_staff_access_atomic(uuid, integer, boolean, uuid)
  from public, anon, authenticated;
grant execute on function public.set_role_permissions_atomic(integer, text[], uuid),
  public.update_staff_access_atomic(uuid, integer, boolean, uuid)
  to service_role;
notify pgrst, 'reload schema';
commit;
