# Dergo24

Platforma e postës Dergo24 për rezervim, gjurmim dhe menaxhim dërgesash në Shqipëri.

## Struktura

- `web/` — faqet, panelet, komponentët, asetet dhe adapterët HTTP të Vinext.
- `api/src/lib/` — adapterët e sesionit, klienti Supabase dhe ndihmësit e përbashkët.
- `api/supabase/migrations/` — migrimet PostgreSQL të aplikacionit.

Framework-u kërkon që endpoint-et të jenë në `web/app/api/`. Këto route eksportojnë controller-at përmes alias-it `@api/*`.

## Arkitektura e API-së

- `api/src/controllers/` — handler-at HTTP të endpoint-eve.
- `api/src/services/` — rregullat e biznesit të aplikacionit.
- `api/src/repositories/` — query-t dhe shkrimet në Supabase/PostgreSQL.
- `api/src/errors/` — gabimet standarde të API-së.
- `api/src/auth/` — kontrollet e roleve.
- `api/src/schemas/` — validimet e kërkesave për shërbimet postare dhe provat e dorëzimit.
- `api/src/types/` — tipet e përbashkëta të profileve.
- `web/app/api/` — adapterë minimalë të kërkuar nga Vinext.

Controller-at lexojnë HTTP/cookies, validojnë kërkesat dhe thërrasin services.
Services zbatojnë rregullat e biznesit dhe autorizimin; vetëm repositories
komunikojnë me Supabase Auth, PostgreSQL dhe Storage. Validimi i adresave
përdor një funksion lokal, pa akses në databazë.

Modulet: `account` (hyrja, regjistrimi, sesionet dhe stafi), `postal`
(korrierët, ofertat, ankesat, vlerësimet dhe pikat), `dashboard`, `delivery`
(provat, etiketat, COD dhe planifikimi), `shipment` (rezervimi dhe gjurmimi).

Rezervimi/importi, përditësimi i statusit dhe konfirmimi i dorëzimit përdorin
transaksione PostgreSQL përmes RPC. Migrimi përkatës duhet aplikuar përpara
këtij versioni të API-së. Kufijtë e transaksioneve, trajtimi i fotove dhe
udhëzimet e aktivizimit janë te `api/supabase/ATOMIC-WRITES.md`.

## Komandat

- `npm run dev` — nis aplikacionin lokalisht.
- `npm run build` — ndërton frontend-in dhe endpoint-et API.
- `npm run start` — nis build-in lokal të Cloudflare Worker.
- `npm run lint` — kontrollon kodin në `web/` dhe `api/`.
- `npm run lint:api` — kontrollon vetëm API-n dhe route-et.
- `npm run typecheck:api` — kontrollon tipet TypeScript të API-së.
