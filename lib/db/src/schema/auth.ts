import { sql } from "drizzle-orm";
import { boolean, index, integer, jsonb, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessionsTable = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const usersTable = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username").unique(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: text("profile_image_url"),
  passwordHash: varchar("password_hash"),
  level: varchar("level"),
  pointsSpent: integer("points_spent").notNull().default(0),
  equippedBackground: varchar("equipped_background"),
  equippedFrame: varchar("equipped_frame"),
  equippedNametag: varchar("equipped_nametag"),
  equippedTitle: varchar("equipped_title"),
  xp: integer("xp").notNull().default(0),
  gameLevel: integer("game_level").notNull().default(1),
  bonusPoints: integer("bonus_points").notNull().default(0),
  isPublic: boolean("is_public").notNull().default(true),
  showNameOnLeaderboard: boolean("show_name_on_leaderboard").notNull().default(true),
  showNameInSearch: boolean("show_name_in_search").notNull().default(true),
  allowProfileView: boolean("allow_profile_view").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type UpsertUser = typeof usersTable.$inferInsert;
export type User = typeof usersTable.$inferSelect;
