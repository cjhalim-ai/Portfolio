import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, boolean, integer, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const folders = pgTable("folders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  color: text("color").default("#6366F1"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const items = pgTable("items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  productUrl: text("product_url"),
  notes: text("notes"),
  folderId: varchar("folder_id").references(() => folders.id),
  isArchived: boolean("is_archived").default(false),
  reviewSchedule: jsonb("review_schedule").$type<string[]>().default([]),
  aiFeatures: jsonb("ai_features").$type<{
    priceTracking: boolean;
    alternatives: boolean;
    sustainability: boolean;
  }>().default({ priceTracking: true, alternatives: true, sustainability: false }),
  currentPrice: decimal("current_price", { precision: 10, scale: 2 }),
  priceHistory: jsonb("price_history").$type<Array<{ price: number; date: string }>>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  archivedAt: timestamp("archived_at"),
  archivedReason: text("archived_reason"),
});

export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  itemId: varchar("item_id").references(() => items.id).notNull(),
  scheduledFor: timestamp("scheduled_for").notNull(),
  completedAt: timestamp("completed_at"),
  reviewType: text("review_type").notNull(), // "1day", "1week", "1month", etc.
  isCompleted: boolean("is_completed").default(false),
  responses: jsonb("responses").$type<Record<string, any>>().default({}),
  decision: text("decision"), // "keep", "archive", "purchase"
  createdAt: timestamp("created_at").defaultNow(),
});

export const customQuestions = pgTable("custom_questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  itemId: varchar("item_id").references(() => items.id).notNull(),
  question: text("question").notNull(),
  reviewType: text("review_type").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const achievements = pgTable("achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // "money_saved", "items_archived", "mindful_decision"
  title: text("title").notNull(),
  description: text("description").notNull(),
  value: decimal("value", { precision: 10, scale: 2 }),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  folders: many(folders),
  items: many(items),
  reviews: many(reviews),
  customQuestions: many(customQuestions),
  achievements: many(achievements),
}));

export const foldersRelations = relations(folders, ({ one, many }) => ({
  user: one(users, {
    fields: [folders.userId],
    references: [users.id],
  }),
  items: many(items),
}));

export const itemsRelations = relations(items, ({ one, many }) => ({
  user: one(users, {
    fields: [items.userId],
    references: [users.id],
  }),
  folder: one(folders, {
    fields: [items.folderId],
    references: [folders.id],
  }),
  reviews: many(reviews),
  customQuestions: many(customQuestions),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
  item: one(items, {
    fields: [reviews.itemId],
    references: [items.id],
  }),
}));

export const customQuestionsRelations = relations(customQuestions, ({ one }) => ({
  user: one(users, {
    fields: [customQuestions.userId],
    references: [users.id],
  }),
  item: one(items, {
    fields: [customQuestions.itemId],
    references: [items.id],
  }),
}));

export const achievementsRelations = relations(achievements, ({ one }) => ({
  user: one(users, {
    fields: [achievements.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertFolderSchema = createInsertSchema(folders).omit({
  id: true,
  createdAt: true,
});

export const insertItemSchema = createInsertSchema(items).omit({
  id: true,
  userId: true,  // userId is added by the server
  createdAt: true,
  archivedAt: true,
  currentPrice: true,
  priceHistory: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});

export const insertCustomQuestionSchema = createInsertSchema(customQuestions).omit({
  id: true,
  createdAt: true,
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
  unlockedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;
export type Folder = typeof folders.$inferSelect;
export type Item = typeof items.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type CustomQuestion = typeof customQuestions.$inferSelect;
export type Achievement = typeof achievements.$inferSelect;

export type InsertFolder = z.infer<typeof insertFolderSchema>;
export type InsertItem = z.infer<typeof insertItemSchema>;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type InsertCustomQuestion = z.infer<typeof insertCustomQuestionSchema>;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
