# SKP Admin Key — security rollout gates

Status: development only. Do not deploy or run either database migration without explicit owner approval.

## Existing code risks that must be resolved before rollout

1. `lib/admin-authorization.ts` accepts a shared-password-derived legacy cookie. This bypasses employee-specific revocation for ordinary store APIs. Remove or disable this path only after the owner's new account and recovery access have been verified.
2. `app/api/store/route.ts` still issues that legacy cookie on password login. Keep production operational during migration, but do not declare the employee system secure while it remains usable.
3. `lib/admin-passkey-enrollment-store.ts` inserts Passkeys without `user_id`. Current employee-aware QR approval rejects such credentials. New enrollment must bind a verified Passkey to a specific active employee; never guess ownership from a shared password.
4. `lib/admin-passkey-enrollment-context.ts` authorizes registration with the shared password and browser cookie, not an individual employee invitation. Do not use this route as an employee onboarding path.
5. `app/admin/staff/page.tsx` is a management UI, not an authorization boundary. All mutations must remain owner-authorized on the server.
6. `db/admin-roles-schema.sql` has not been applied to production. Run only after backup, schema review, owner bootstrap and explicit approval.
7. Verify blocking under concurrent QR approval, QR redemption, session creation, and privileged API requests. Static tests do not establish race safety.
8. Design an owner-only audited invitation with a one-use expiring secret, hashed at rest, bound to the target employee; require independent verification before accepting WebAuthn registration.
9. Decide whether synced Passkeys are acceptable. A Passkey is not necessarily tied to one physical phone.
10. Implement the installable scanner PWA with local camera processing, HTTPS, iOS Safari compatibility, cleanup of camera tracks, and no third-party QR upload.

## Release acceptance tests

- Owner creates employee; employee cannot sign in until verified onboarding completes.
- Employee's Passkey belongs to exactly one active employee; blocked users cannot register or approve.
- A blocked employee loses all sessions and cannot approve, consume or create a new QR session.
- An administrator cannot list, create, block or reactivate other employees.
- Legacy shared-password login cannot bypass revocation after cutover.
- Owner remains able to access and recover the account; owner cannot be blocked by staff API.
- Production migration has backup, rollback procedure, monitoring and explicit approval.

## Passkey-only cutover switch (not enabled)

`SKP_ADMIN_REQUIRE_PASSKEY=true` disables legacy shared-password cookies, local development authorization bypasses and the password login endpoint. It retains database-backed, employee-linked sessions only. Do **not** enable this switch until owner bootstrap, employee enrollment, production database migrations, and real-device QR/Passkey tests have been completed and explicitly approved. If the database is unavailable, authorization fails closed. The `ADMIN_PASSWORD` secret remains required for session token hashing during this transition; removing it would invalidate all QR sessions. Never enable this setting as part of the draft PR or automatically deploy it.

## Owner bootstrap (manual, not executed)

After applying all three reviewed SQL migrations and receiving explicit production approval, an operator may run `scripts/bootstrap-admin-owner.mjs --confirm-owner-bootstrap` with `DATABASE_URL`, `SKP_OWNER_DISPLAY_NAME` and `SKP_OWNER_BOOTSTRAP_APPROVED=YES` set in a secure terminal. It refuses to run if any owner already exists and uses a PostgreSQL advisory transaction lock to serialize bootstrap attempts. The script prints a one-time, 15-minute registration link to the operator terminal; treat the URL as a secret and never paste it into public chats or logs. The owner must register their Passkey through the invitation page before any password-only cutover. The script does not enable the feature flag, create sessions or change deployed settings. Run only once, after backups, with access-controlled operator credentials.
