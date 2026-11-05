-- SKP admin authentication v2. Apply only after review and backup.
-- PostgreSQL / Neon. No changes to existing shop, orders or reviews tables.
BEGIN;
CREATE TABLE IF NOT EXISTS skp_admin_sessions_v2 (
  token_hash TEXT PRIMARY KEY,
  expires BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS skp_admin_sessions_v2_expiry_idx ON skp_admin_sessions_v2(expires);

CREATE TABLE IF NOT EXISTS skp_admin_passkeys (
  credential_id TEXT PRIMARY KEY,
  public_key BYTEA NOT NULL,
  counter BIGINT NOT NULL DEFAULT 0 CHECK (counter >= 0),
  transports JSONB NOT NULL DEFAULT '[]'::jsonb,
  device_label TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS skp_admin_webauthn_challenges (
  challenge_hash TEXT PRIMARY KEY,
  purpose TEXT NOT NULL CHECK (purpose IN ('register', 'authenticate')),
  request_id TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS skp_admin_webauthn_challenges_expiry_idx ON skp_admin_webauthn_challenges(expires_at);

CREATE TABLE IF NOT EXISTS skp_admin_qr_requests (
  request_hash TEXT PRIMARY KEY,
  desktop_secret_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','consumed','expired','denied')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  approved_credential_id TEXT REFERENCES skp_admin_passkeys(credential_id),
  approved_at TIMESTAMPTZ,
  consumed_at TIMESTAMPTZ,
  CHECK (expires_at > created_at)
);
CREATE INDEX IF NOT EXISTS skp_admin_qr_requests_expiry_idx ON skp_admin_qr_requests(expires_at);
COMMIT;
