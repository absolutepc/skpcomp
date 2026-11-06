# SKP QR / Passkey: production rollout with password fallback

**Planning document only.** Do not merge, deploy, change Vercel environment variables, or run SQL against production without separate explicit approval. Draft PR #28 targets `vercel-deploy`, not `main`.

## Preconditions

1. Confirm latest CI is green on the exact release SHA (static-security, typecheck, vercel-build, auth-integration).
2. Identify the current production Vercel deployment and immutable rollback deployment; record the release SHA.
3. Create and verify a restorable backup/snapshot of production Neon. Test the restoration procedure separately where possible. A code rollback **does not** restore database state.
4. Review all SQL against the current production schema and data. `db/admin-passkey-schema.sql` creates new admin tables; `db/admin-roles-schema.sql` alters those new admin tables and adds roles/audit tables; `db/admin-employee-invites-schema.sql` adds invitation tables. These scripts do not intentionally modify `shop`, `skp_orders`, or `product_reviews`. Do not assume they are risk-free without schema inspection.
5. Review the owner bootstrap and recovery procedure. No owner is auto-created by these migrations; never enable mandatory Passkey until an owner Passkey is enrolled and a recovery method verified.
6. Preserve existing `ADMIN_PASSWORD` unchanged. Current session hashes depend on it even when password login is disabled.

## Controlled rollout (separate approvals)

**Gate A — database:** after explicit approval and verified backup, apply reviewed SQL in dependency order. Check schema, existing store/orders counts, and current admin password login. Stop on any unexpected change.

**Gate B — application:** after separate deployment approval, deploy tested branch to production with `SKP_ADMIN_REQUIRE_PASSKEY` unset/false. Verify existing admin login, catalog, media upload, orders, and logout before proceeding. Keep the previous deployment ready for immediate rollback.

**Gate C — owner enrollment:** use the audited production owner bootstrap process; enroll a real iPhone Passkey, confirm owner permissions and a tested recovery path. Never turn on Passkey-only mode just to test initial enrollment.

**Gate D — QR smoke test:** test desktop QR, iPhone Face ID approval, one-time redemption, session expiry/revocation, and employee restrictions. Keep password login enabled during this phase.

**Gate E — optional cutover:** only after separate owner approval and proven recovery, consider `SKP_ADMIN_REQUIRE_PASSKEY=true`. This is **not** required for QR login testing and disables legacy password login. Do not delete `ADMIN_PASSWORD` because it is also a session-hash secret.

## Rollback

- **Application regression:** revert to the recorded prior Vercel deployment. If newly added tables remain, older code should ignore them; verify this assumption on the exact rollback version.
- **Authentication regression:** keep legacy password login enabled during initial rollout. Revert application deployment if QR authentication misbehaves. Do not rotate `ADMIN_PASSWORD` as an emergency workaround: it invalidates existing sessions.
- **Database incident:** stop writes, assess the failure, and restore from a verified backup only after considering any orders placed since the snapshot. A full database restore can discard intervening customer data. Never run destructive DROP statements as a routine rollback.
- Record incidents and pause further gates until resolved.

## Evidence to capture

CI run URLs, exact SHA, backup confirmation and restore test, reviewed SQL, Vercel deployment IDs, test device/browser versions, owner recovery outcome, and sign-off per gate.
