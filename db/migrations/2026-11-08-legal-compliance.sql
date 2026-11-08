-- SKP legal module, additive PostgreSQL migration. Apply only after review and backup.
-- No real seller data or legal documents are inserted by this migration.
BEGIN;
CREATE TABLE IF NOT EXISTS legal_seller_profile (
  id TEXT PRIMARY KEY CHECK (id = 'current'),
  seller_type TEXT NOT NULL DEFAULT 'unconfirmed' CHECK (seller_type IN ('unconfirmed','ip','ooo')),
  full_name TEXT NOT NULL DEFAULT '',
  short_name TEXT NOT NULL DEFAULT '',
  inn TEXT NOT NULL DEFAULT '',
  registration_number TEXT NOT NULL DEFAULT '',
  legal_address TEXT NOT NULL DEFAULT '',
  postal_address TEXT NOT NULL DEFAULT '',
  contact_email TEXT NOT NULL DEFAULT '',
  contact_phone TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS legal_documents (
  id TEXT PRIMARY KEY,
  document_type TEXT NOT NULL CHECK (document_type IN ('privacy','terms','returns','delivery','warranty','cookies','consent_order','consent_marketing')),
  version INTEGER NOT NULL CHECK (version > 0),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  checksum TEXT NOT NULL,
  effective_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (document_type,version),
  CHECK (status <> 'published' OR (published_at IS NOT NULL AND effective_at IS NOT NULL))
);
CREATE UNIQUE INDEX IF NOT EXISTS legal_documents_one_published_per_type
  ON legal_documents(document_type) WHERE status='published';
CREATE TABLE IF NOT EXISTS legal_consents (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES legal_documents(id),
  purpose TEXT NOT NULL CHECK (purpose IN ('order','marketing','cookies','contact','review')),
  context_type TEXT NOT NULL,
  context_id TEXT NOT NULL DEFAULT '',
  consented_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  evidence_digest TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS legal_consents_context_idx ON legal_consents(context_type,context_id);
CREATE TABLE IF NOT EXISTS legal_subject_requests (
  id TEXT PRIMARY KEY,
  request_type TEXT NOT NULL CHECK (request_type IN ('access','correction','deletion','restriction','other')),
  contact TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','verifying','in_progress','completed','rejected')),
  resolution TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS legal_audit_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  actor TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  details TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS legal_audit_entity_idx ON legal_audit_events(entity_type,entity_id,created_at DESC);
COMMIT;
