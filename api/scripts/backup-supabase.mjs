import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const tables = [
  'app_sessions',
  'auth_generations',
  'claims',
  'customer_profiles',
  'delivery_proofs',
  'delivery_ratings',
  'drivers',
  'permissions',
  'pickup_points',
  'quote_requests',
  'request_limits',
  'role_permissions',
  'roles',
  'shipments',
  'staff_audit_logs',
  'staff_profiles',
  'tracking_events',
  'vehicles',
];

function parseEnvironment(contents) {
  return Object.fromEntries(
    contents
      .split(/\r?\n/)
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const separator = line.indexOf('=');
        return [line.slice(0, separator), line.slice(separator + 1)];
      }),
  );
}

async function readTable(supabase, table) {
  const rows = [];
  const pageSize = 1000;
  for (let start = 0; ; start += pageSize) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .range(start, start + pageSize - 1);
    if (error) throw new Error(`Unable to back up ${table}: ${error.message}`);
    rows.push(...data);
    if (data.length < pageSize) return rows;
  }
}

const environment = parseEnvironment(
  await readFile(new URL('../../web/.env.local', import.meta.url), 'utf8'),
);
const url = environment.SUPABASE_URL;
const key = environment.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error('Supabase backup credentials are unavailable.');

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const data = {};
for (const table of tables) data[table] = await readTable(supabase, table);

const users = [];
for (let page = 1; ; page += 1) {
  const { data: response, error } = await supabase.auth.admin.listUsers({
    page,
    perPage: 1000,
  });
  if (error) throw new Error(`Unable to back up Auth identities: ${error.message}`);
  users.push(...response.users);
  if (response.users.length < 1000) break;
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const outputDirectory = path.resolve('output', 'backups');
await mkdir(outputDirectory, { recursive: true });
const outputPath = path.join(outputDirectory, `dergo24-${timestamp}.json`);
await writeFile(
  outputPath,
  JSON.stringify(
    {
      format: 'dergo24-logical-backup-v1',
      createdAt: new Date().toISOString(),
      projectUrl: url,
      authUsers: users,
      tables: data,
    },
    null,
    2,
  ),
  { encoding: 'utf8', mode: 0o600 },
);

console.log(outputPath);
