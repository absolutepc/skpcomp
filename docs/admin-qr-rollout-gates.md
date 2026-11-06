# QR / Passkey rollout gates

This feature remains disabled in production until **all** gates are satisfied.

1. CI: typecheck, build, and security checks pass. Static source checks alone are not sufficient.
2. Registration API: enforce fresh admin password reauthentication server-side, bind registration challenge to the reauthenticated session, verify user presence and verification, and store credentials only after cryptographic verification.
3. QR approval: signed assertion must be bound to the pending QR request; explicit approval required; rate-limit and reject replay.
4. QR redemption: desktop-only secret is never included in the QR URL; redeem exactly once. `redeemQrSession()` runs inside `withActiveAdminUser()`, which opens `adminTransaction()`; its AsyncLocalStorage-bound PostgreSQL client covers both `consumeApprovedQr()` and `issueAdminSession()` (the latter uses a nested lock/transaction scope). A session insert failure should therefore roll back redemption. **BLOCKER: verify this behavior with actual PostgreSQL fault-injection and concurrent-redemption integration tests before enabling QR redemption.**
5. Authorization: update **all** admin API routes to accept the new random database-backed session, while preserving password login and logout. Audit every route before enabling QR redemption.
6. Browser UI: create QR on desktop, show expiration, poll with desktop secret; on phone request WebAuthn assertion and require explicit approval. Never log or persist desktop secret.
7. Tests: actual WebAuthn verification integration tests, QR concurrency/replay, rate-limit, cookie security, existing password login, session revocation, all admin API routes, mobile Safari and desktop Safari.
8. Database: migration to Neon requires explicit owner approval; plan rollback and maintenance for expired challenges, QR requests, sessions and rate-limit buckets.
9. Deployment: require explicit owner approval for Vercel production deployment; verify RP origin and TLS; enroll a real iPhone Passkey and run end-to-end test.

**Current state:** server primitives and draft endpoints exist; gates 2, 4, 5, 6, 7, 8 and 9 are incomplete. Gate 4 has a transaction implementation but lacks fault-injection and concurrency evidence for the full redemption/session flow; do not mark it verified until those tests pass. The QR login is **not production ready**. Do not merge this draft PR or apply the migration without approval.
