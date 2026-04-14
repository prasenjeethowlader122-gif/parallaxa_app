import { pgTable, text, integer } from "drizzle-orm/pg-core";
import { postsTable } from "./posts";

export const hashtagsTable = pgTable("hashtags", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  postCount: integer("post_count").notNull().default(0),
});

export const postHashtagsTable = pgTable("post_hashtags", {
  postId: text("post_id").notNull().references(() => postsTable.id, { onDelete: "cascade" }),
  hashtagId: text("hashtag_id").notNull().references(() => hashtagsTable.id, { onDelete: "cascade" }),
});

export type Hashtag = typeof hashtagsTable.$inferSelect;
export type PostHashtag = typeof postHashtagsTable.$inferSelect;
