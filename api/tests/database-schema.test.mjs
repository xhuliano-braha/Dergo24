import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const migrationUrl = new URL(
  '../supabase/migrations/20260911120000_relational_integrity.sql',
  import.meta.url,
);

const sql = await readFile(migrationUrl, 'utf8');

test('profiles are relational extensions of Supabase Auth users', () => {
  assert.match(
    sql,
    /customer_profiles_auth_user_fkey[\s\S]*references auth\.users\(id\)/i,
  );
  assert.match(
    sql,
    /staff_profiles_auth_user_fkey[\s\S]*references auth\.users\(id\)/i,
  );
});

test('customer-owned records enforce shipment ownership', () => {
  assert.match(
    sql,
    /claims_shipment_customer_fkey[\s\S]*foreign key \(shipment_id, customer_id\)[\s\S]*references public\.shipments\(id, customer_id\)/i,
  );
  assert.match(
    sql,
    /delivery_ratings_shipment_customer_driver_fkey[\s\S]*foreign key \(shipment_id, customer_id, driver_id\)[\s\S]*references public\.shipments\(id, customer_id, driver_id\)/i,
  );
});

test('history tables are append-only for the application role', () => {
  assert.match(
    sql,
    /revoke update, delete on table public\.tracking_events from service_role/i,
  );
  assert.match(
    sql,
    /revoke update, delete on table public\.staff_audit_logs from service_role/i,
  );
});

test('driver logins are restricted to courier staff', () => {
  assert.match(sql, /create trigger drivers_enforce_staff_role/i);
  assert.match(sql, /role\.name = 'courier'/i);
  assert.match(
    sql,
    /create trigger staff_profiles_protect_linked_courier_role/i,
  );
});
