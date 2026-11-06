-- Development-only employee onboarding extension.
-- Requires db/admin-passkey-schema.sql and db/admin-roles-schema.sql.
-- Never apply to production without backup and explicit approval.
BEGIN;
CREATE TABLE IF NOT EXISTS skp_admin_employee_invites (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id UUID NOT NULL REFERENCES skp_admin_users(id),
 token_hash TEXT NOT NULL UNIQUE,
 created_by UUID NOT NULL REFERENCES skp_admin_users(id),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 expires_at TIMESTAMPTZ NOT NULL,
 consumed_at TIMESTAMPTZ,
 revoked_at TIMESTAMPTZ,
 CHECK (expires_at>created_at),
 CHECK (NOT (consumed_at IS NOT NULL AND revoked_at IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS skp_admin_employee_invites_user_idx
 ON skp_admin_employee_invites(user_id);
CREATE INDEX IF NOT EXISTS skp_admin_employee_invites_expiry_idx
 ON skp_admin_employee_invites(expires_at);
COMMIT;
