/**
 * PostgreSQL queries for SKP. Driver-neutral: inject a client/pool with a
 * parameterized query(sql, values) method (such as node-postgres Pool).
 * This module does not access Cloudflare and does not create connections.
 *
 * Database schema: db/postgres-schema.sql
 * IMPORTANT: It is not yet wired to the live API routes.
 */
export type PgQueryResult<T> = { rows: T[] };
export type PgClient = {
  query<T extends Record<string, unknown> = Record<string, unknown>>(
    sql: string, values?: readonly unknown[]
  ): Promise<PgQueryResult<T>>;
};

export type ReviewRow = {
  id: string; product_id: string; author: string; rating: number;
  body: string; status: string; created_at: string;
};

export async function loadCatalogJson(db: PgClient): Promise<string | null> {
  const result = await db.query<{ value: string }>(
    "SELECT value FROM shop WHERE id=$1", ["catalog"]
  );
  return result.rows[0]?.value ?? null;
}

export async function saveCatalogJson(db: PgClient, value: string): Promise<void> {
  await db.query(
    "INSERT INTO shop (id,value) VALUES ($1,$2) ON CONFLICT(id) DO UPDATE SET value=EXCLUDED.value",
    ["catalog", value]
  );
}

export async function listReviewsForAdmin(db: PgClient): Promise<ReviewRow[]> {
  const result = await db.query<ReviewRow>(
    "SELECT id,product_id,author,rating,body,status,created_at FROM product_reviews ORDER BY created_at DESC LIMIT 250"
  );
  return result.rows;
}

export async function listApprovedReviews(db: PgClient, productId: string): Promise<ReviewRow[]> {
  const result = await db.query<ReviewRow>(
    "SELECT id,product_id,author,rating,body,created_at FROM product_reviews WHERE product_id=$1 AND status='approved' ORDER BY created_at DESC LIMIT 100",
    [productId]
  );
  return result.rows;
}

export async function moderateReview(db: PgClient, id: string, status: "approved" | "rejected"): Promise<void> {
  await db.query("UPDATE product_reviews SET status=$1 WHERE id=$2", [status, id]);
}

export async function countRecentReviews(db: PgClient, ipHash: string): Promise<number> {
  const result = await db.query<{ total: string | number }>(
    "SELECT count(*)::integer AS total FROM product_reviews WHERE ip_hash=$1 AND created_at::timestamp > (now() AT TIME ZONE 'UTC') - interval '24 hours'",
    [ipHash]
  );
  return Number(result.rows[0]?.total ?? 0);
}

export async function insertPendingReview(db: PgClient, review: {
  id: string; productId: string; author: string; rating: number;
  body: string; ipHash: string;
}): Promise<void> {
  await db.query(
    "INSERT INTO product_reviews (id,product_id,author,rating,body,status,ip_hash) VALUES ($1,$2,$3,$4,$5,'pending',$6)",
    [review.id, review.productId, review.author, review.rating, review.body, review.ipHash]
  );
}
