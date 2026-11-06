-- Staging-only migration for owner step-up authorization.
-- NOT approved for production. Apply after existing admin identity migrations.
BEGIN;
CREATE TABLE IF NOT EXISTS skp_admin_owner_step_up_grants (
  grant_hash TEXT PRIMARY KEY,
  owner_user_id UUID NOT NULL REFERENCES skp_admin_users(id),
  session_token_hash TEXT NOT NULL REFERENCES skp_admin_sessions_v2(token_hash) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('owner-passkey-enroll','owner-passkey-revoke')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  CHECK (expires_at > created_at)
);
CREATE INDEX IF NOT EXISTS skp_admin_owner_step_up_grants_expiry_idx
 ON skp_admin_owner_step_up_grants(expires_at);
CREATE INDEX IF NOT EXISTS skp_admin_owner_step_up_grants_owner_idx
 ON skp_admin_owner_step_up_grants(owner_user_id,session_token_hash);
COMMIT;
