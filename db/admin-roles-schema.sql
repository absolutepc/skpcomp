-- SKP Admin Key: employee roles and revocable access (phase 1, schema only).
-- Apply ONLY after backup, review and explicit production migration approval.
-- Requires db/admin-passkey-schema.sql first.
-- No account is auto-created: owner bootstrap requires a separate audited flow.
BEGIN;
CREATE TABLE IF NOT EXISTS skp_admin_users (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 display_name TEXT NOT NULL CHECK (char_length(trim(display_name)) BETWEEN 1 AND 120),
 role TEXT NOT NULL CHECK (role IN ('owner','admin')),
 status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','blocked')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 blocked_at TIMESTAMPTZ,
 CHECK ((status='blocked') = (blocked_at IS NOT NULL))
);
CREATE UNIQUE INDEX IF NOT EXISTS skp_admin_one_owner_idx
 ON skp_admin_users(role) WHERE role='owner';
CREATE INDEX IF NOT EXISTS skp_admin_users_status_idx ON skp_admin_users(status);

-- Nullable during migration only. Login must fail closed for unassigned credentials.
ALTER TABLE skp_admin_passkeys ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES skp_admin_users(id);
CREATE INDEX IF NOT EXISTS skp_admin_passkeys_user_idx ON skp_admin_passkeys(user_id)
 WHERE revoked_at IS NULL;

ALTER TABLE skp_admin_sessions_v2 ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES skp_admin_users(id);
CREATE INDEX IF NOT EXISTS skp_admin_sessions_user_idx ON skp_admin_sessions_v2(user_id);

ALTER TABLE skp_admin_qr_requests ADD COLUMN IF NOT EXISTS approved_user_id UUID REFERENCES skp_admin_users(id);
CREATE INDEX IF NOT EXISTS skp_admin_qr_approved_user_idx ON skp_admin_qr_requests(approved_user_id)
 WHERE status='approved';

CREATE TABLE IF NOT EXISTS skp_admin_security_events (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 actor_user_id UUID REFERENCES skp_admin_users(id),
 target_user_id UUID REFERENCES skp_admin_users(id),
 event_type TEXT NOT NULL CHECK (event_type IN (
  'user_created','user_blocked','user_reactivated','passkey_registered',
  'passkey_revoked','login_approved','login_denied','session_revoked'
 )),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 details JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS skp_admin_security_events_created_idx
 ON skp_admin_security_events(created_at DESC);

-- Future revocation transaction must lock the user row, set status blocked,
-- revoke ALL passkeys, DELETE ALL sessions, and invalidate pending/approved
-- QR requests. Every privileged API must independently check active status.
-- Until all server paths enforce user_id and status, do NOT deploy this flow.
COMMIT;
