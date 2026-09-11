# Dergo24 API

This folder contains the Dergo24 backend:

- `src/controllers/` handles HTTP input and responses.
- `src/services/` contains business rules and workflow orchestration.
- `src/repositories/` is the only application layer that queries Supabase.
- `src/security/` contains sessions, throttling, and upload protection.
- `supabase/migrations/` contains the ordered PostgreSQL migration history.
- [`supabase/DATABASE.md`](./supabase/DATABASE.md) explains the final database
  model, relationships, conventions, and safe migration workflow.
- `tsconfig.json` type-checks the backend independently.

Public endpoints remain thin adapters in `web/app/api/` because Vinext uses
file-based routing. The adapters import backend modules through `@api/*`.
