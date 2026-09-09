# Error check — 2026-09-09

## Corrections

- Fixed PNG encoder TypeScript errors: instantiate the decoder's PNG type
  and explicitly use Node Buffer for base64 encoding.
- Registration no longer assumes a session was created. The customer page
  explains verification, offers email resend and code verification, then
  returns to normal password login.
- Upload controls now match the backend: JPEG or PNG, up to 5 MiB and
  2 megapixels. WebP is no longer offered by the file pickers.

## Blocking runtime configuration

Read-only checks against the configured Supabase project found:

- `lookup_app_session` is absent (`PGRST202`).
- `request_limits`, `auth_generations`, and `app_sessions` are absent
  (`PGRST205`).

Apply `supabase/migrations/20260907140000_security_controls.sql` using the
Supabase SQL Editor or a PostgreSQL migration connection before testing
login. The migration was executed successfully in isolated PostgreSQL,
not against the hosted database. The current middleware intentionally fails
closed while these security controls are unavailable: API requests can
return 503, including login. Do not bypass the controls to hide the error.

No direct database URL or connected Supabase browser was available during
the preceding remediation, so the live migration remains unapplied.

For production, configure APP_ORIGIN, TRUSTED_PROXY and RATE_LIMIT_SECRET
as described in `../web/.env.example`. The Cloudflare option is safe only
when traffic reaches the application exclusively through Cloudflare, which
overwrites CF-Connecting-IP; do not trust arbitrary client-supplied headers
on a directly reachable Node server. Local development uses a shared local
client identifier and does not require those proxy variables.

Email verification also needs functioning Supabase email delivery and a
correct Site URL/redirect allowlist. The email may contain a confirmation
link, an OTP, or both depending on its template. No real email-delivery
test or hosted authentication test was performed in this check.

## Validation

The isolated PostgreSQL/security regression script passed 16 checks:
schema execution, shared counters, separate-client isolation, expiry,
session audience checks, hashed storage, logout revocation, generation
invalidation, banned-user rejection, public-role denial, valid image
decoding/sanitization, invalid-image rejection, and fail-closed proxy
configuration, customer session issuance, unconfirmed-login denial,
password reauthentication/revocation, and registration without automatic
login (related assertions are grouped into 16 checks).

API and web TypeScript checks, API lint and targeted changed-web lint passed.
The production build passed. Full-project lint still reports 19 existing
issues in shared UI components/hooks (accessibility semantics, React effect
state updates and chart template expressions); those unrelated components
were not changed. No claim is made that the full lint command passes.

This is not a claim that all earlier audit findings are deployed or that
the authentication service is ready for public use. Legacy auto-confirmed
accounts, MFA rollout, email-delivery setup and live deployment testing
still require review.
