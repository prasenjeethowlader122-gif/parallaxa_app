import { pgTable, text, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const postsTable = pgTable("posts", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  // null = top-level post; set = reply/comment on another post
  parentPostId: text("parent_post_id").references(
    (): any => postsTable.id,
    { onDelete: "cascade" },
  ),
  content: text("content"),
  imageUrl: text("image_url"),
  videoUrl: text("video_url"),
  repostOfId: text("repost_of_id").references((): any => postsTable.id, {
    onDelete: "cascade",
  }),
  location: text("location"),
  likesCount: integer("likes_count").notNull().default(0),
  repostsCount: integer("reposts_count").notNull().default(0),
  repliesCount: integer("replies_count").notNull().default(0),
  isArchived: boolean("is_archived").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertPostSchema = createInsertSchema(postsTable).omit({
  likesCount: true,
  repostsCount: true,
  repliesCount: true,
  isArchived: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof postsTable.$inferSelect;