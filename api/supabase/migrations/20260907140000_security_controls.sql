begin;
create table public.request_limits (
  key_hash text primary key check (key_hash ~ '^[a-f0-9]{64}$'),
  attempts integer not null check (attempts > 0),
  expires_at timestamptz not null
);
create index request_limits_expiry on public.request_limits (expires_at);
create table public.auth_generations (
  user_id uuid primary key references auth.users(id) on delete cascade,
  generation bigint not null default 0
);
create table public.app_sessions (
  token_hash text primary key check (token_hash ~ '^[a-f0-9]{64}$'),
  user_id uuid not null references auth.users(id) on delete cascade,
  audience text not null check (audience in ('customer', 'staff')),
  expires_at timestamptz not null
);
create index app_sessions_user on public.app_sessions (user_id);
create index app_sessions_expiry on public.app_sessions (expires_at);
alter table public.request_limits enable row level security;
alter table public.auth_generations enable row level security;
alter table public.app_sessions enable row level security;
revoke all on public.request_limits, public.auth_generations, public.app_sessions from public, anon, authenticated;
grant select, insert, update, delete on public.request_limits, public.auth_generations, public.app_sessions to service_role;

create function public.consume_request_limit(p_key text, p_limit integer, p_seconds integer)
returns integer language plpgsql security invoker set search_path = '' as $$
declare bucket public.request_limits%rowtype;
begin
  if p_key is null or p_key !~ '^[a-f0-9]{64}$' or p_limit is null or p_limit not between 1 and 1000
    or p_seconds is null or p_seconds not between 1 and 86400 then
    raise sqlstate 'PT400' using message = 'Invalid rate limit';
  end if;
  delete from public.request_limits where key_hash in (
    select key_hash from public.request_limits where expires_at < now() limit 100
  );
  insert into public.request_limits as limits (key_hash, attempts, expires_at)
    values (p_key, 1, now() + make_interval(secs => p_seconds))
  on conflict (key_hash) do update set
    attempts = case when limits.expires_at <= now() then 1 else least(limits.attempts + 1, p_limit + 1) end,
    expires_at = case when limits.expires_at <= now() then now() + make_interval(secs => p_seconds) else limits.expires_at end
  returning * into bucket;
  if bucket.attempts > p_limit then
    return greatest(1, ceil(extract(epoch from bucket.expires_at - now()))::integer);
  end if;
  return 0;
end;
$$;
create function public.auth_generation(p_user uuid) returns bigint
language plpgsql security invoker set search_path = '' as $$
declare current_generation bigint;
begin
  insert into public.auth_generations (user_id) values (p_user) on conflict do nothing;
  select generation into current_generation from public.auth_generations where user_id = p_user;
  return current_generation;
end;
$$;
create function public.issue_app_session(p_user uuid, p_generation bigint, p_hash text, p_audience text)
returns void language plpgsql security invoker set search_path = '' as $$
declare current_generation bigint;
begin
  select generation into current_generation from public.auth_generations where user_id = p_user for update;
  if current_generation is null or current_generation is distinct from p_generation then
    raise sqlstate 'PT409' using message = 'Authentication changed; sign in again';
  end if;
  delete from public.app_sessions where token_hash in (
    select token_hash from public.app_sessions where expires_at <= now() limit 100
  );
  insert into public.app_sessions(token_hash, user_id, audience, expires_at)
    values (p_hash, p_user, p_audience, now() + interval '1 hour');
end;
$$;
create function public.lookup_app_session(p_hash text, p_audience text) returns uuid
language sql security definer set search_path = '' as $$
  select sessions.user_id from public.app_sessions sessions join auth.users users on users.id = sessions.user_id
  where sessions.token_hash = p_hash and sessions.audience = p_audience and sessions.expires_at > now()
    and users.deleted_at is null and (users.banned_until is null or users.banned_until <= now())
    and users.email_confirmed_at is not null;
$$;
create function public.revoke_user_sessions(p_user uuid) returns void
language plpgsql security invoker set search_path = '' as $$
begin
  insert into public.auth_generations(user_id, generation) values (p_user, 1)
    on conflict(user_id) do update set generation = public.auth_generations.generation + 1;
  delete from public.app_sessions where user_id = p_user;
end;
$$;
revoke all on function public.consume_request_limit(text, integer, integer), public.auth_generation(uuid),
  public.issue_app_session(uuid, bigint, text, text), public.lookup_app_session(text, text),
  public.revoke_user_sessions(uuid) from public, anon, authenticated;
grant execute on function public.consume_request_limit(text, integer, integer), public.auth_generation(uuid),
  public.issue_app_session(uuid, bigint, text, text), public.lookup_app_session(text, text),
  public.revoke_user_sessions(uuid) to service_role;
notify pgrst, 'reload schema';
commit;
