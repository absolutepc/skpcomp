-- Additive owner step-up hardening. Run only after explicit production approval.
-- Requires admin-passkey, admin-roles and admin-owner-step-up schemas.
-- Nullable for compatibility: old grants fail closed, never backfill identity.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
ALTER TABLE skp_admin_owner_step_up_grants
 ADD COLUMN IF NOT EXISTS verified_credential_id TEXT REFERENCES skp_admin_passkeys(credential_id);
COMMIT;
