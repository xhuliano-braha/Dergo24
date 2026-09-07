# Security hardening review

Completed locally on 2026-09-06. This is an application hardening pass,
not a penetration-test certification or production-readiness guarantee.
No database migration, deployment, or existing password change was performed.

## Implemented

- API middleware rejects state-changing requests with missing, null or
  foreign Origin headers, and contradictory Fetch Metadata. This includes
  login, registration, logout and multipart uploads. Existing Strict,
  HttpOnly session cookies remain in place; production cookies use Secure.
- API responses passing through middleware carry private/no-store,
  nosniff, DENY framing and no-referrer headers.
- JSON endpoints enforce application/json and a streamed 1 MiB limit.
  Delivery multipart requests are capped at 6 MiB before parsing.
  The actual bytes are counted, not just the client-supplied Content-Length.
- Photos remain capped at 5 MiB in private Storage with randomized paths.
  Declared JPEG/PNG/WebP types must match file headers and basic structure;
  empty files and forged HTML images are rejected. PNG signatures must
  contain base64-encoded PNG bytes, not just the expected data-URL prefix.
- Customer and staff password changes require the current password,
  reauthenticate the same user ID, and clear the current browser cookie
  after success. Both password forms now collect the current password.
  Administrative resets remain restricted to administrators.
- Inactive courier drivers no longer receive assigned shipments in their
  dashboard, matching existing proof-access restrictions.
- Login/password-verification attempts share a normalized account throttle:
  10 attempts per 15 minutes. Staff aliases map to their canonical email.
  Registration permits 3 attempts per email per 15 minutes. The middleware
  additionally caps combined login/registration requests at 60 per minute.
  Rejections return 429 and Retry-After. Throttle keys are hashed, expired
  entries are removed and the map has a bounded capacity.

## API compatibility

Browser same-origin requests work without frontend request changes.
Scripts and external clients making POST/PATCH/PUT/DELETE calls must send
`Origin: http://localhost:3000` locally, or the exact deployed origin.
This header is a browser CSRF control, not authentication for API clients.
JSON requests must send `Content-Type: application/json`.

Set server-only `APP_ORIGIN` to the canonical production origin, such as
`https://your-domain.example`, with no trailing slash or path. Without it,
the request URL origin is used. Verify this behind the actual hosting proxy;
untrusted forwarded headers are not used to build the allowed origin.
Keep API traffic going through the middleware when changing deployment
adapters. Verify negative origin tests against the deployed build too.

Password endpoints now require both `currentPassword` and `newPassword`.
No existing password was weakened, reset, or printed during this review.

## Verification

- API TypeScript, web TypeScript, API lint and targeted changed-web lint passed.
- Production build and tracked-file whitespace checks passed.
- 8 security checks passed: origin rejection, streamed and declared body
  limits, valid/forged/empty/oversized images, concurrent normalized throttle
  behavior and expiry, HTTP content types/syntax/size, and protected reads.
- 25 live HTTP workflow checks passed against the configured Supabase
  project. These include the prior complete delivery flow plus missing/wrong
  current-password rejection, successful password rotation and sign-in,
  inactive-driver rejection, and forged photo/signature rejection.
- All five synthetic Auth identities, driver, shipment, related rows and
  uploaded photo were removed. Independent reads verified cleanup.

The development server itself rejects foreign-origin requests before
middleware; missing-origin rejection and normal API security headers were
also tested through the application middleware. These were API tests, not
browser-interaction, multi-worker, image-decoder or load tests.

## Required before a public launch

1. Replace the in-memory throttles with shared, atomic limits at the trusted
   edge or database/Redis layer. Current limits reset on restart and are
   independent per worker; the global budget is shared by all users in that
   worker and is only a local defense. Add trusted-client limits, registration
   bot protection and public booking/tracking/quote abuse controls.
2. Enable verified-email onboarding and staff MFA. Current customer creation
   still uses admin auto-confirmation; possession of the email is not proven.
   Retire any demo/default credentials and strengthen new-password policy.
3. Implement explicit session revocation and session inventory. Clearing a
   cookie does not revoke a copied access token. Password rotation here was
   tested for credentials, not immediate invalidation of every old session.
4. Add full image decoding/re-encoding, metadata stripping and malware
   scanning as appropriate. Header checks are not a decoder or antivirus.
   Define proof retention and reconcile orphan uploads after failed writes.
5. Verify live RLS/Storage policies and grants, secret handling, backups and
   recovery. Repository migrations enable RLS and restrict atomic RPCs to
   service_role, but this review did not audit every live policy or restore.
6. Configure HTTPS, canonical origin, page-level security headers/CSP,
   audit logs, monitoring and alerts; run deployed security/regression tests.

Review references: [OWASP authentication guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html),
[CSRF guidance](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html),
and [file upload guidance](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html).
