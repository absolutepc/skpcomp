import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
export const shop = sqliteTable("shop", {id: text("id").primaryKey(), value: text("value").notNull()});
export const productReviews = sqliteTable("product_reviews", {
 id:text("id").primaryKey(),
 productId:text("product_id").notNull(),
 author:text("author").notNull(),
 rating:integer("rating").notNull(),
 body:text("body").notNull(),
 status:text("status").notNull(),
 ipHash:text("ip_hash").notNull(),
 createdAt:text("created_at").notNull()
});
