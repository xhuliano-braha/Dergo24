begin;

create extension if not exists pg_cron with schema pg_catalog;

select cron.schedule(
  'dergo24-cleanup-expired-security-state',
  '17 * * * *',
  'select * from public.cleanup_expired_security_state()'
);

commit;
