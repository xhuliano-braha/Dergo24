# Atomic shipment writes

Migration: `migrations/20260906120000_atomic_shipments.sql`.
Apply this migration before running the corresponding API version.
It adds functions only; it does not rewrite existing shipment records.

| Backend operation | PostgreSQL function | Transaction contents |
| --- | --- | --- |
| Booking and CSV import | `book_shipments_atomic` | All shipments and their initial tracking events |
| Status/assignment update | `update_shipment_atomic` | Shipment update and tracking event |
| Delivery confirmation | `confirm_delivery_atomic` | Proof, delivery status, COD collection status and tracking event |

The functions run as the calling database role (security invoker).
Only `service_role` has execution permission; public, anonymous and
authenticated roles cannot invoke them. The server supplies the actor ID from
its authenticated session, never from the submitted request body.
Staff activity, role and courier assignment are checked inside the transaction.
Shipment rows are locked during updates and delivery confirmation.

Ordinary status updates cannot mark a shipment delivered or change COD.
Use the delivery-proof endpoint for delivery and the existing settlement
endpoint to change collected COD to settled. Settlement is already one
conditional SQL update. Completed/cancelled shipments cannot be reopened
through the ordinary update endpoint.

The API does not fall back to separate writes if an RPC fails or is missing.
Known validation, authorization and conflict errors become HTTP 400, 403,
404 or 409; unexpected/database availability errors become 503.
An interrupted HTTP response can leave the caller uncertain whether the
transaction committed. Check tracking/current state before retrying; these
functions do not provide a general request-idempotency mechanism.

## Storage boundary

Photo upload happens before the database transaction. Supabase Storage and
PostgreSQL do not share this transaction. A failed or interrupted confirmation
can leave an unreferenced photo. Do not automatically delete a photo after an
ambiguous network failure: the transaction may have committed and reference it.
Reconcile aged, unreferenced objects separately after checking
`delivery_proofs.photo_path`. Photo signing and uploads otherwise keep their
existing private bucket behavior.

Route-order planning remains a separate multi-query operation; this migration
only changes shipment lifecycle writes.

## Validation performed

All existing SQL migrations plus this migration were executed in an isolated
PGlite PostgreSQL engine. Checks covered successful booking, complete batch
rollback, status-update rollback, delivery-proof/status/COD/event rollback
using an injected failing tracking trigger, successful confirmation,
duplicate/settled confirmation rejection, unassigned courier rejection,
function privileges and repeat migration execution.
The temporary validation harness is in the ignored
`.wrangler/atomic-validation/` folder, not in the production bundle.
These checks exercise real PostgreSQL transactions but do not simulate
multi-connection concurrency or remote Storage failures.

## Rollout

Apply the SQL migration in the project's SQL Editor (or your normal migration
pipeline), then deploy the API. If using SQL Editor, reconcile the migration
with your deployment history before later using CLI migration commands.
The migration is re-runnable using `create or replace function`.
For an application rollback, retain the functions: older application versions
can still use existing tables. Do not drop functions while this API version
is serving requests.
