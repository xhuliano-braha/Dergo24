# Dergo24 API

Ky folder përmban shtresën backend të Dergo24:

- `src/lib/` për autentikim, akses në PostgreSQL/Supabase, validim dhe rregulla biznesi.
- `supabase/migrations/` për skemën dhe migrimet PostgreSQL.
- `db/` dhe `drizzle/` për zgjerime të ardhshme të databazës.
- `tsconfig.json` për kontroll të pavarur të kodit backend.

Endpoint-et publike mbeten adapterë të hollë në `web/app/api/`, sepse Vinext përdor routing bazuar në file. Adapterët importojnë backend-in me `@api/*`.
