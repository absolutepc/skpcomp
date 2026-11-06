# SKP Admin QR / Passkey — isolated staging acceptance

This is a **manual runbook**, not permission to deploy, merge, or migrate. Keep PR #28 Draft and production untouched until the owner explicitly approves each change.

## Prerequisites (must be confirmed, not assumed)

- [ ] Provision a **separate** PostgreSQL database with no connection to production Neon. Verify its host, database name, and account before running any schema SQL.
- [ ] Create a separate HTTPS staging domain with a stable hostname. WebAuthn credentials are RP-ID bound; arbitrary Vercel preview hostnames are not interchangeable.
- [ ] Configure staging environment variables: `SKP_DATABASE_PROVIDER=postgres`, isolated `DATABASE_URL`, `SKP_ADMIN_OWNER_BACKUP_ENROLLMENT=staging`, `SKP_ADMIN_STAGING_DB_ISOLATED=confirmed`, and `SKP_ADMIN_STAGING_ORIGIN=https://<staging-host>`.
- [ ] Keep a strong staging-only `ADMIN_PASSWORD` configured. `SKP_ADMIN_REQUIRE_PASSKEY=true` disables password **login**, but the password is still used as a session-token hash secret.
- [ ] Keep staging-only credentials, media storage, and secrets separate from production. Do not copy real customer orders or staff records.
- [ ] Confirm latest branch CI passes: static security, TypeScript, Vercel build, and disposable PostgreSQL integration.

## Device acceptance (Mac Safari + iPhone Safari)

1. Open the staging admin login on the Mac; confirm the QR is shown and expires.
2. Enroll the owner Passkey on the iPhone using the documented owner enrollment procedure; verify the owner identity and device unlock.
3. Scan the Mac QR with the iPhone, authenticate with Face ID/Passkey, explicitly approve, and confirm the Mac receives an HttpOnly Secure SameSite=Strict session cookie.
4. Confirm the QR cannot be redeemed a second time, an expired QR fails, and a QR opened on a different desktop cannot complete the original desktop session.
5. Confirm a regular employee can access authorized admin pages but cannot manage staff or recovery; blocking the employee invalidates their active access.
6. Confirm catalog read/edit, image upload, order list/status, and logout using a Passkey session. Verify data stays in staging only.
7. Reject a cross-origin POST and malformed JSON; confirm no unexpected server errors or sensitive tokens in browser console, URLs, analytics, or logs.
8. Confirm the owner recovery flow with an independent recovery method, including loss of the primary phone. Do not assume a printed QR is equivalent to a hardware security key.

## Release stop conditions

Do not enable production if any CI job fails, any test is unverified, staging isolation is uncertain, owner recovery is untested, or an authorization/CSRF check fails. Production schema migration, Vercel deployment, and `SKP_ADMIN_REQUIRE_PASSKEY` cutover each require explicit approval and a documented rollback plan. Preserve the existing password login until the owner approves the cutover.
