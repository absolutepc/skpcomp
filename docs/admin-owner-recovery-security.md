# SKP Admin Key — owner recovery security contract

> Обновлено 6 ноября 2026: текущий production-mode, миграции, доказательство оставшегося ключа и внедрение на основном сайте с сохранённым паролем описаны в [актуальном плане](admin-owner-production-readiness.md). Ниже — исторический план; требования отдельного staging и утверждения о неготовой реализации заменены актуальным документом. Emergency recovery всех потерянных ключей по-прежнему не реализован.

Status: implementation plan, **not an enabled recovery mechanism**. No production migration, bootstrap, deployment or auth cutover is authorized by this document.

## Threat model and policy

The owner must survive loss of the primary iPhone without creating a remotely exploitable password-equivalent bypass. A recovery code alone, a staff account, an email address, a phone number, an existing legacy admin password or a copied invitation link MUST NOT confer owner access.

### Tier 1: independent backup Passkey

- While authenticated as the active owner, enroll a second credential using a fresh, single-use WebAuthn registration challenge, verified origin/RP ID, UV and an owner-session recheck under the existing user row lock.
- Bind it to the **same owner user_id**. Do not create a second owner or issue a staff invitation.
- Require the backup to be independent of the primary phone's synced credential ecosystem; a FIDO2 hardware security key is preferred. Show the owner the credential name, creation time and last-used time.
- Test a login with the backup credential before declaring recovery ready. Removing the last verified owner credential must be blocked unless another verified credential remains.
- After recovering, allow the owner to revoke lost credentials and all sessions, then register a new primary credential.

### Tier 2: offline emergency recovery (future, separate review)

- Generate high-entropy, single-use recovery secrets server-side using a CSPRNG. Display/download once, never persist plaintext or include them in logs/analytics.
- Store only domain-separated, keyed verification digests (key in a separate environment secret, not the database). Constant-time comparison, per-code consumed timestamp, owner linkage and audit events.
- **A code is not sufficient for access.** Require a second independent offline recovery factor, or a reviewed, authenticated operator-assisted process with a delay and notification. No automatic owner session or Passkey enrollment from code alone.
- Apply dedicated per-account and per-origin rate limits, generic failure responses, short-lived recovery state, CSRF protection, and alerts on initiation/completion.
- Recovery finalization must lock the owner row, atomically consume the recovery proof and invalidate all previous sessions and relevant challenges; require registration and successful verification of a new Passkey.
- If every independent factor is lost, fail closed and use a separately approved manual recovery procedure. No hidden master password, universal bypass, or bootstrap rerun.

## Release gates

1. Implement and test owner-only backup credential enrollment and revocation, including WebAuthn signature/UV checks, row locking, concurrency and active-owner revalidation.
2. Verify **two independent** owner credentials in a disposable PostgreSQL staging database and test both on real devices. Document whether a synced Passkey is genuinely independent.
3. Implement emergency recovery only after agreeing on the independent second factor and threat model; exercise replay, race, leak and brute-force tests.
4. Review Vercel Blob token behavior and cutover rollback plan.
5. Approve production migrations, owner enrollment, deployment and Passkey-only cutover as **separate explicit actions**.

The current one-time owner bootstrap script is for first enrollment only. It is not an emergency recovery endpoint and must never be repurposed as an unauthenticated reset.
