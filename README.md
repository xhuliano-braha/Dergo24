# Dergo24

Platforma e postës Dergo24 për rezervim, gjurmim dhe menaxhim dërgesash në Shqipëri.

## Struktura

- `web/` — faqet, panelet, komponentët, asetet dhe adapterët HTTP të Vinext.
- `api/src/lib/` — autentikimi, Supabase, validimi, skemat dhe rregullat e biznesit.
- `api/supabase/migrations/` — migrimet PostgreSQL të aplikacionit.

Framework-u kërkon që endpoint-et të jenë në `web/app/api/`. Këto route përdorin logjikën backend nga `api/src/lib/` përmes alias-it `@api/*`.

## Komandat

- `npm run dev` — nis aplikacionin lokalisht.
- `npm run build` — ndërton frontend-in dhe endpoint-et API.
- `npm run start` — nis build-in lokal të Cloudflare Worker.
- `npm run lint` — kontrollon kodin në `web/` dhe `api/`.
