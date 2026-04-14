import { pgTable, text, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const conversationsTable = pgTable("conversations", {
  id: text("id").primaryKey(),
  participant1Id: text("participant1_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  participant2Id: text("participant2_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  lastMessageId: text("last_message_id"),
  unreadCount1: integer("unread_count1").notNull().default(0),
  unreadCount2: integer("unread_count2").notNull().default(0),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const messagesTable = pgTable("messages", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id").notNull().references(() => conversationsTable.id, { onDelete: "cascade" }),
  senderId: text("sender_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  content: text("content"),
  mediaUrl: text("media_url"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Conversation = typeof conversationsTable.$inferSelect;
export type Message = typeof messagesTable.$inferSelect;
