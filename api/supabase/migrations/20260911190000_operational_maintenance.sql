begin;

-- A single bounded maintenance entrypoint keeps ephemeral security tables from
-- growing indefinitely. Invoke it from Supabase Cron or another trusted job.
create or replace function public.cleanup_expired_security_state()
returns table (expired_sessions bigint, expired_request_limits bigint)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  deleted_sessions bigint;
  deleted_limits bigint;
begin
  delete from public.app_sessions where expires_at < now();
  get diagnostics deleted_sessions = row_count;

  delete from public.request_limits where expires_at < now();
  get diagnostics deleted_limits = row_count;

  return query select deleted_sessions, deleted_limits;
end;
$$;

revoke all on function public.cleanup_expired_security_state()
  from public, anon, authenticated;
grant execute on function public.cleanup_expired_security_state()
  to service_role;

comment on function public.cleanup_expired_security_state() is
  'Deletes expired application sessions and request-limit counters; intended for a trusted scheduled job.';

notify pgrst, 'reload schema';
commit;
