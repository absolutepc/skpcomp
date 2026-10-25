-- SKP PostgreSQL schema, adapted from db/schema.ts (Cloudflare D1 / SQLite).
-- Apply only to an EMPTY PostgreSQL database after taking a backup.
-- Existing D1 data MUST be exported and migrated separately.
BEGIN;
CREATE TABLE IF NOT EXISTS shop (
  id TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS product_reviews (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  author TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  ip_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD HH24:MI:SS'))
);
CREATE INDEX IF NOT EXISTS product_reviews_product_status_created_idx
  ON product_reviews (product_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS product_reviews_ip_created_idx
  ON product_reviews (ip_hash, created_at DESC);
COMMIT;
