import { pgTable, serial, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

export const chatMessagesTable = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  senderId: varchar("sender_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  receiverId: varchar("receiver_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  readAt: timestamp("read_at", { withTimezone: true }),
});

export type ChatMessage = typeof chatMessagesTable.$inferSelect;
