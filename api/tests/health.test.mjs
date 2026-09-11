import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const route = await readFile(
  new URL('../../web/app/api/health/route.ts', import.meta.url),
  'utf8',
);
const controller = await readFile(
  new URL('../src/controllers/health.controller.ts', import.meta.url),
  'utf8',
);
const migration = await readFile(
  new URL(
    '../supabase/migrations/20260911190000_operational_maintenance.sql',
    import.meta.url,
  ),
  'utf8',
);
const scheduleMigration = await readFile(
  new URL(
    '../supabase/migrations/20260911200000_schedule_maintenance.sql',
    import.meta.url,
  ),
  'utf8',
);

test('health endpoint is dynamic and never cached', () => {
  assert.match(route, /health\.controller/);
  assert.match(controller, /force-dynamic/);
  assert.match(controller, /Cache-Control': 'no-store'/);
});

test('maintenance function cleans both expiring security tables', () => {
  assert.match(
    migration,
    /delete from public\.app_sessions where expires_at < now\(\)/i,
  );
  assert.match(
    migration,
    /delete from public\.request_limits where expires_at < now\(\)/i,
  );
  assert.match(migration, /grant execute[\s\S]*to service_role/i);
});

test('expired security state is cleaned on an hourly schedule', () => {
  assert.match(scheduleMigration, /create extension if not exists pg_cron/i);
  assert.match(scheduleMigration, /'17 \* \* \* \*'/);
  assert.match(scheduleMigration, /cleanup_expired_security_state\(\)/);
});
