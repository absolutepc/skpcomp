# SKP owner backup Passkey — step-up implementation contract

> Обновлено 6 ноября 2026: текущий production-mode, миграции, доказательство оставшегося ключа и внедрение на основном сайте с сохранённым паролем описаны в [актуальном плане](admin-owner-production-readiness.md). Ниже — исторический план; требования отдельного staging и утверждения о неготовой реализации заменены актуальным документом. Emergency recovery всех потерянных ключей по-прежнему не реализован.

Status: design and acceptance contract only. **Do not enable backup enrollment, merge PR #28, deploy, migrate production, or switch off legacy login.**

## Current finding (2026-11-06)
The staging-only `POST /api/admin/owner/passkeys/complete` currently accepts an authenticated owner session plus a valid registration attestation. The existing `verifyOwnerStepUp` verifies a signed owner assertion, but no registration flow currently requires a recent successful step-up proof. A browser session alone is not adequate authorization to add another owner credential.

## Required server flow

1. Owner opens key management from an existing database-backed owner session. No staff or legacy password-only session can start this flow.
2. Server issues a fresh, single-use authentication challenge bound to the owner user ID **and current session ID**; allow only already registered, non-revoked owner credentials. Verify signature, RP ID, origin, UV, counter, challenge expiry and active owner/session under owner row lock.
3. After successful assertion, create a random, short-lived **server-side step-up grant**, bound to owner ID, session ID and action `owner-passkey-enroll`. Do not send an unrestricted bearer recovery token to the browser; prefer a same-session server-side grant record. Store creation/expiry/consumption and audit event. Do not infer success from the presence of a previously issued challenge.
4. Registration options require that unexpired grant, create a fresh registration challenge and bind it to the grant and same owner session. Exclude current credentials in authenticator options where supported. Require UV.
5. Completion verifies attestation cryptographically and, **in one PostgreSQL transaction under owner lock**, checks current session, consumes registration challenge and step-up grant exactly once, inserts credential under same owner ID, and writes audit event. Any failure rolls back all mutations.
6. A new key is **unverified for recovery** until a subsequent independent successful authentication using that exact credential. The owner UI must not mark it as a tested backup at registration time.
7. Revocation requires a **new** step-up grant scoped to `owner-passkey-revoke`, same-session binding and atomic consumption; never allow removal of the final verified active owner credential. Invalidate affected sessions where credential/session linkage permits; do not promise that existing sessions are individually revoked without checking implementation.
8. Keep `SKP_ADMIN_OWNER_BACKUP_ENROLLMENT` disabled in production until physical-device staging acceptance and explicit owner approval.

## Negative tests (required)

- Stolen authenticated cookie without fresh assertion cannot enroll or revoke.
- Assertion signed by employee or another owner ID is rejected.
- Wrong RP ID, origin, signature, UV=false, stale challenge, replay and concurrent completions rejected.
- Grant cannot be reused, applied to another session, action, owner, or after expiry.
- Owner disabled during verification or between challenge and transaction causes rejection.
- DB insertion/audit failure rolls back grant and challenge consumption.
- Two simultaneous registrations cannot consume one grant twice.
- Backup not labeled verified until a login with that credential.
- Last verified owner key cannot be revoked.
- Existing password login and storefront remain unchanged before cutover.

## Device acceptance

Use separate HTTPS staging origin/RP ID, disposable PostgreSQL database, Mac desktop and physical iPhone Safari/PWA; test NFC/USB key where supported. Confirm a successful login with the backup after the primary phone is unavailable. Synced Passkeys may not be independent backups.

No QR printed on a card should be treated as a standalone owner credential. A QR can identify a recovery workflow but must never grant owner access on its own.
