# SKP Admin: QR + Passkeys — implementation plan

Status: **development branch only**. No QR sign-in is enabled on production.

## Deployment origin
- Production origin: `https://skpcomp.vercel.app`
- WebAuthn RP ID: `skpcomp.vercel.app`
- Never derive the allowed origin or RP ID from an untrusted request Host header.
- Passkeys registered for this RP ID are not automatically valid on a future custom domain.

## Actual Vercel authentication (verified in `vercel-deploy`)
- `app/api/store/route.ts` currently uses a deterministic password-derived cookie token (`sha256('skp-session:'+ADMIN_PASSWORD)`), not a per-login random server-side session. This must be replaced before QR sign-in is activated.
- `db/platform-store.ts` selects Neon PostgreSQL when `SKP_DATABASE_PROVIDER=postgres` and uses `DATABASE_URL` with `pg`. The user's reported successful production password login does not itself prove that every production endpoint uses Neon.
- `app/shop.tsx` renders the `/admin` login.
- Preserve password login as a recovery path, but move both password and QR login to short-lived, revocable, randomly generated server-side sessions.
- Do not copy `lib/admin-session.ts` from `main` into Vercel unchanged; it depends on Cloudflare D1 and SQLite queries.

## Required stages
1. **Infrastructure verification:** verify `SKP_DATABASE_PROVIDER=postgres`, `DATABASE_URL`, database migrations and the actual deployed Git branch. Use the existing `db/platform-store.ts` abstraction or an explicit PostgreSQL adapter; do not assume Cloudflare D1 exists on Vercel.
2. **WebAuthn enrollment:** require an existing admin session and recent password re-authentication. Generate a short-lived random registration challenge server-side; verify origin, RP ID, challenge, user presence and user verification, attestation/authenticator data, and public-key format. Persist credential ID, public key, counter, transports, creation date, and revoked state in the database. Never store private keys or biometrics.
3. **QR request:** create a cryptographically random, single-use 60-second challenge, store only a hash server-side, rate-limit requests, and display a URL containing only the temporary challenge (never a session token).
4. **Phone approval:** require a valid WebAuthn assertion from an enrolled credential with user verification. Display requesting browser/device information and require explicit approval. Bind assertion challenge to the specific QR login request and server-side state. Reject replay, expiry, revoked credentials, and cross-origin attempts.
5. **Desktop completion:** atomically consume the approved QR request and issue the same type of server-side session as password login. Use short polling or server push with strict no-store caching. Prevent double redemption and session fixation.
6. **Recovery:** retain password login; implement credential revocation, active session termination, audit logging, and sensible rate limits.
7. **Tests:** challenge replay, wrong origin/RP ID, expired QR, forged approval, concurrent consumption, unauthorized enrollment, CSRF, cross-browser session issuance, revoked credentials, and local/production environments.

## Important security notes
- Passkeys synchronized via iCloud Keychain prove possession of the registered credential, **not necessarily one unique physical iPhone**. The UI should say “registered passkey”, not “verified physical phone”.
- Do not trust a scanned QR code as authorization; it is only a request identifier.
- QR phishing remains possible: show a recognizable browser/device request and require a deliberate confirmation on the phone.
- Enrollment, approval and session issuance must be implemented together; a partial QR endpoint must not be enabled as an alternative login.
- Use a maintained, audited WebAuthn server verifier (for example `@simplewebauthn/server`) with compatible dependencies and lockfile; do not hand-roll CBOR, COSE, signature, and authenticator-data verification.
- Do not alter the SKP storefront appearance while developing authentication.

## Implementation checkpoint — Vercel branch
- Feature branch: `feature/vercel-admin-qr-passkeys`, created directly from `vercel-deploy` (not `main`).
- Added `lib/vercel-admin-session.ts` with cryptographically random 32-byte cookie tokens, hashed DB persistence and revocation. **Not wired into production handlers yet.**
- The current Vercel store and orders APIs each implement the legacy password-derived cookie check independently. Before enabling v2 sessions, audit every admin-protected endpoint and migrate all checks together; otherwise some admin actions will fail after login.
- Confirm whether the deployed Vercel project uses `SKP_DATABASE_PROVIDER=postgres`; `DATABASE_URL` alone does not select the PG adapter.
- A WebAuthn verifier, persistent challenges, QR approval/consumption, device enrollment, end-to-end tests and actual build validation remain outstanding.


## Owner backup key — hardware-test gate (2026-11-06)

The owner management UI and API are implemented only in the feature branch and guarded by `SKP_ADMIN_OWNER_BACKUP_ENROLLMENT=staging`. Passing CI is **not** proof that a physical USB/NFC key can recover an account.

**Blocking deployment constraint:** `lib/admin-passkey-config.ts` intentionally accepts only `https://skpcomp.vercel.app` (RP ID `skpcomp.vercel.app`) or development localhost. An arbitrary Vercel preview hostname cannot run WebAuthn with that RP ID. Do **not** loosen origin validation to accept arbitrary preview domains, and do **not** enable the owner backup feature on production just to test it. Before hardware tests, design an isolated HTTPS staging origin and explicit allowlist/RP policy, with a separate test database and test owner. Credentials created for a staging RP ID will not automatically authenticate on the production RP ID.

Required manual acceptance tests on that isolated environment:
1. Existing owner Passkey authenticates for an action-scoped step-up; no challenge from a second session or a different action is accepted.
2. Register the USB/NFC backup authenticator with user verification. Confirm that the new credential is visible in owner inventory, but **not** labelled verified solely because enrollment succeeded.
3. From a fresh browser session, complete a real owner sign-in using **only** the newly registered key; verify server-side owner role and session issuance, not just a successful WebAuthn prompt.
4. Sign out, remove the primary device, and repeat the backup-only sign-in. Check session expiry and logout.
5. Revoke a non-last test key after a fresh action-scoped step-up; confirm revoked key login fails, other key still works, replay fails and audit event exists.
6. Confirm the last active key cannot be revoked; verify password fallback remains available, and never test destructive lockout on a real production owner.
7. Verify unsupported origins, mismatched RP IDs, wrong-session challenges, expired challenges, cancellation, and rate limiting.

**Release gate:** no production merge, schema migration, environment toggle or password-login cutover until these tests pass and the owner explicitly approves deployment. A QR printed on a card is not a credential and must never independently grant access.
