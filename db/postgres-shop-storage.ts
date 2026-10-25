/**
 * PostgreSQL-backed SKP catalog/review storage.
 * Uses parameterized SQL via the generic PgClient interface.
 * This adapter keeps the current JSON catalog format exactly unchanged.
 *
 * Note: API routing and pool creation are separate integration steps.
 */
import {
  loadCatalogJson, saveCatalogJson, listReviewsForAdmin,
  listApprovedReviews, moderateReview, countRecentReviews,
  insertPendingReview,
  type PgClient,
} from "./postgres-queries";

export function postgresShopStorage(db: PgClient) {
  return {
    async getCatalog() {
      const value = await loadCatalogJson(db);
      if (value === null) return null;
      const parsed: unknown = JSON.parse(value);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("Invalid stored SKP catalog");
      }
      return parsed;
    },
    async saveCatalog(catalog: unknown) {
      const value = JSON.stringify(catalog);
      if (typeof value !== "string") throw new Error("Cannot serialize SKP catalog");
      await saveCatalogJson(db, value);
    },
    listReviewsForAdmin: () => listReviewsForAdmin(db),
    listApprovedReviews: (productId: string) => listApprovedReviews(db, productId),
    moderateReview: (id: string, status: "approved" | "rejected") =>
      moderateReview(db, id, status),
    countRecentReviews: (hash: string) => countRecentReviews(db, hash),
    insertPendingReview: (review: {
      id: string; productId: string; author: string; rating: number;
      body: string; ipHash: string;
    }) => insertPendingReview(db, review),
  };
}
