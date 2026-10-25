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

-- Orders are handled by /api/orders. Keep all existing D1 records during migration.
CREATE TABLE IF NOT EXISTS skp_orders (
 id TEXT PRIMARY KEY, number TEXT NOT NULL UNIQUE,
 access_hash TEXT NOT NULL, customer_name TEXT NOT NULL,
 phone TEXT NOT NULL, comment TEXT NOT NULL DEFAULT '',
 items TEXT NOT NULL, total INTEGER NOT NULL,
 status TEXT NOT NULL DEFAULT 'processing',
 ip_hash TEXT NOT NULL DEFAULT '',
 created_at TEXT NOT NULL DEFAULT (to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD HH24:MI:SS')),
 updated_at TEXT NOT NULL DEFAULT (to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD HH24:MI:SS'))
);
CREATE TABLE IF NOT EXISTS skp_order_events (
 id TEXT PRIMARY KEY, order_id TEXT NOT NULL,
 status TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT (to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD HH24:MI:SS'))
);
CREATE INDEX IF NOT EXISTS idx_skp_order_events_order ON skp_order_events(order_id,created_at);
CREATE INDEX IF NOT EXISTS idx_skp_orders_created ON skp_orders(created_at);

COMMIT;
