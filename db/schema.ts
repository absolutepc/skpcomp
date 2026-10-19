import { sqliteTable, text } from "drizzle-orm/sqlite-core";
export const shop = sqliteTable("shop", {id: text("id").primaryKey(), value: text("value").notNull()});