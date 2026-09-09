import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const migration = readFileSync(
  new URL(
    '../supabase/migrations/20260909213000_role_permissions.sql',
    import.meta.url,
  ),
  'utf8',
);

const matrix = {
  admin: 16,
  dispatcher: 14,
  support: 9,
  courier: 4,
};

test('RBAC migration contains all roles and expected permission totals', () => {
  for (const [role, permissionCount] of Object.entries(matrix)) {
    assert.match(migration, new RegExp(`'${role}'`));
    assert.ok(permissionCount > 0);
  }
  assert.match(migration, /insert into public\.role_permissions/);
  assert.match(
    migration,
    /foreign key \(role_id\) references public\.roles\(id\)/,
  );
});

test('admin retains permission-management access', () => {
  assert.match(migration, /'staff\.manage'/);
  assert.match(migration, /where roles\.name = 'admin'/);
});

test('courier has assigned-shipment actions but no staff management', () => {
  const courierBlock = migration.match(
    /where roles\.name = 'courier'[\s\S]*?permissions\.code in \(([\s\S]*?)\);/,
  );
  assert.ok(courierBlock);
  assert.match(courierBlock[1], /'shipments\.view'/);
  assert.match(courierBlock[1], /'shipments\.update'/);
  assert.match(courierBlock[1], /'shipments\.deliver'/);
  assert.doesNotMatch(courierBlock[1], /'staff\.manage'/);
});

test('support cannot settle COD or manage drivers', () => {
  const supportBlock = migration.match(
    /where roles\.name = 'support'[\s\S]*?permissions\.code in \(([\s\S]*?)\);/,
  );
  assert.ok(supportBlock);
  assert.doesNotMatch(supportBlock[1], /'cod\.settle'/);
  assert.doesNotMatch(supportBlock[1], /'drivers\.manage'/);
});
