import { 
  users,
  folders,
  items,
  reviews,
  customQuestions,
  achievements,
  type User,
  type UpsertUser,
  type Folder, 
  type Item, 
  type Review, 
  type CustomQuestion, 
  type Achievement,
  type InsertFolder, 
  type InsertItem, 
  type InsertReview, 
  type InsertCustomQuestion,
  type InsertAchievement 
} from "@shared/schema";
import { db } from "./db";
import { eq, and, lte } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Folders
  getFolders(userId: string): Promise<Folder[]>;
  getFolder(id: string, userId: string): Promise<Folder | undefined>;
  createFolder(folder: InsertFolder & { userId: string }): Promise<Folder>;
  updateFolder(id: string, userId: string, updates: Partial<InsertFolder>): Promise<Folder | undefined>;
  deleteFolder(id: string, userId: string): Promise<boolean>;

  // Items
  getItems(userId: string, folderId?: string, isArchived?: boolean): Promise<Item[]>;
  getItem(id: string, userId: string): Promise<Item | undefined>;
  createItem(item: InsertItem & { userId: string }): Promise<Item>;
  updateItem(id: string, userId: string, updates: Partial<InsertItem>): Promise<Item | undefined>;
  deleteItem(id: string, userId: string): Promise<boolean>;
  archiveItem(id: string, userId: string, reason: string): Promise<Item | undefined>;

  // Reviews
  getReviews(userId: string, itemId?: string): Promise<Review[]>;
  getReview(id: string, userId: string): Promise<Review | undefined>;
  createReview(review: InsertReview & { userId: string }): Promise<Review>;
  updateReview(id: string, userId: string, updates: Partial<InsertReview>): Promise<Review | undefined>;
  getDueReviews(userId: string): Promise<Review[]>;
  getReviewsByType(userId: string, reviewType: string): Promise<Review[]>;

  // Custom Questions
  getCustomQuestions(itemId: string, userId: string): Promise<CustomQuestion[]>;
  createCustomQuestion(question: InsertCustomQuestion & { userId: string }): Promise<CustomQuestion>;
  deleteCustomQuestion(id: string, userId: string): Promise<boolean>;

  // Achievements
  getAchievements(userId: string): Promise<Achievement[]>;
  createAchievement(achievement: InsertAchievement & { userId: string }): Promise<Achievement>;

  // Stats
  getTotalSaved(userId: string): Promise<number>;
  getStats(userId: string): Promise<{
    activeItems: number;
    dueReview: number;
    archivedItems: number;
    totalSaved: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    
    // Initialize default folders for new users
    await this.initializeDefaultFolders(user.id);
    return user;
  }

  // Initialize default folders for new users
  async initializeDefaultFolders(userId: string): Promise<void> {
    const existingFolders = await this.getFolders(userId);
    if (existingFolders.length > 0) return;

    const defaultFolders = [
      { userId, name: "Electronics", color: "#6366F1" },
      { userId, name: "Home & Garden", color: "#10B981" },
      { userId, name: "Clothing", color: "#EC4899" },
      { userId, name: "Books", color: "#F59E0B" },
    ];

    await db.insert(folders).values(defaultFolders);
  }

  // Folders
  async getFolders(userId: string): Promise<Folder[]> {
    return await db.select().from(folders).where(eq(folders.userId, userId));
  }

  async getFolder(id: string, userId: string): Promise<Folder | undefined> {
    const [folder] = await db.select().from(folders).where(
      and(eq(folders.id, id), eq(folders.userId, userId))
    );
    return folder;
  }

  async createFolder(insertFolder: InsertFolder & { userId: string }): Promise<Folder> {
    const [folder] = await db.insert(folders).values(insertFolder).returning();
    return folder;
  }

  async updateFolder(id: string, userId: string, updates: Partial<InsertFolder>): Promise<Folder | undefined> {
    const [folder] = await db
      .update(folders)
      .set(updates)
      .where(and(eq(folders.id, id), eq(folders.userId, userId)))
      .returning();
    return folder;
  }

  async deleteFolder(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(folders)
      .where(and(eq(folders.id, id), eq(folders.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Items
  async getItems(userId: string, folderId?: string, isArchived?: boolean): Promise<Item[]> {
    let conditions = [eq(items.userId, userId)];
    
    if (folderId) {
      conditions.push(eq(items.folderId, folderId));
    }
    
    if (isArchived !== undefined) {
      conditions.push(eq(items.isArchived, isArchived));
    }
    
    return await db.select().from(items).where(and(...conditions));
  }

  async getItem(id: string, userId: string): Promise<Item | undefined> {
    const [item] = await db.select().from(items).where(
      and(eq(items.id, id), eq(items.userId, userId))
    );
    return item;
  }

  async createItem(insertItem: InsertItem & { userId: string }): Promise<Item> {
    const itemData = {
      ...insertItem,
      isArchived: false,
      currentPrice: insertItem.price,
      priceHistory: [{ price: Number(insertItem.price), date: new Date().toISOString() }],
      archivedAt: null,
      archivedReason: null,
    };
    
    const [item] = await db.insert(items).values(itemData).returning();
    
    // Create initial reviews based on schedule
    if (insertItem.reviewSchedule) {
      for (const reviewType of insertItem.reviewSchedule) {
        await this.createReviewForSchedule(item.id, insertItem.userId, reviewType);
      }
    }
    
    return item;
  }

  private async createReviewForSchedule(itemId: string, userId: string, reviewType: string): Promise<void> {
    const scheduleMap: Record<string, number> = {
      "1day": 1,
      "1week": 7,
      "1month": 30,
      "3months": 90,
      "6months": 180,
      "1year": 365,
    };

    const days = scheduleMap[reviewType];
    if (!days) return;

    const scheduledFor = new Date();
    scheduledFor.setDate(scheduledFor.getDate() + days);

    await this.createReview({
      userId,
      itemId,
      scheduledFor,
      reviewType,
      isCompleted: false,
      responses: {},
      completedAt: null,
      decision: null,
    });
  }

  async updateItem(id: string, userId: string, updates: Partial<InsertItem>): Promise<Item | undefined> {
    const validUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    
    const [item] = await db
      .update(items)
      .set(validUpdates)
      .where(and(eq(items.id, id), eq(items.userId, userId)))
      .returning();
    return item;
  }

  async deleteItem(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(items)
      .where(and(eq(items.id, id), eq(items.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  async archiveItem(id: string, userId: string, reason: string): Promise<Item | undefined> {
    const item = await this.getItem(id, userId);
    if (!item) return undefined;
    
    const [updatedItem] = await db
      .update(items)
      .set({
        isArchived: true,
        archivedAt: new Date(),
        archivedReason: reason,
      })
      .where(and(eq(items.id, id), eq(items.userId, userId)))
      .returning();
    
    // Create achievement for money saved
    await this.createAchievement({
      userId,
      type: "money_saved",
      title: "Mindful Decision",
      description: `You saved $${item.price} by thoughtfully deciding not to purchase ${item.name}`,
      value: item.price,
    });
    
    return updatedItem;
  }

  // Reviews
  async getReviews(userId: string, itemId?: string): Promise<Review[]> {
    let conditions = [eq(reviews.userId, userId)];
    
    if (itemId) {
      conditions.push(eq(reviews.itemId, itemId));
    }
    
    return await db.select().from(reviews).where(and(...conditions));
  }

  async getReview(id: string, userId: string): Promise<Review | undefined> {
    const [review] = await db.select().from(reviews).where(
      and(eq(reviews.id, id), eq(reviews.userId, userId))
    );
    return review;
  }

  async createReview(insertReview: InsertReview & { userId: string }): Promise<Review> {
    const [review] = await db.insert(reviews).values(insertReview).returning();
    return review;
  }

  async updateReview(id: string, userId: string, updates: Partial<InsertReview>): Promise<Review | undefined> {
    const [review] = await db
      .update(reviews)
      .set(updates)
      .where(and(eq(reviews.id, id), eq(reviews.userId, userId)))
      .returning();
    return review;
  }

  async getDueReviews(userId: string): Promise<Review[]> {
    const now = new Date();
    return await db.select().from(reviews).where(
      and(
        eq(reviews.userId, userId),
        eq(reviews.isCompleted, false),
        lte(reviews.scheduledFor, now)
      )
    );
  }

  async getReviewsByType(userId: string, reviewType: string): Promise<Review[]> {
    return await db.select().from(reviews).where(
      and(eq(reviews.userId, userId), eq(reviews.reviewType, reviewType))
    );
  }

  // Custom Questions
  async getCustomQuestions(itemId: string, userId: string): Promise<CustomQuestion[]> {
    return await db.select().from(customQuestions).where(
      and(eq(customQuestions.itemId, itemId), eq(customQuestions.userId, userId))
    );
  }

  async createCustomQuestion(insertQuestion: InsertCustomQuestion & { userId: string }): Promise<CustomQuestion> {
    const [question] = await db.insert(customQuestions).values(insertQuestion).returning();
    return question;
  }

  async deleteCustomQuestion(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(customQuestions)
      .where(and(eq(customQuestions.id, id), eq(customQuestions.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Achievements
  async getAchievements(userId: string): Promise<Achievement[]> {
    return await db.select().from(achievements).where(eq(achievements.userId, userId));
  }

  async createAchievement(insertAchievement: InsertAchievement & { userId: string }): Promise<Achievement> {
    const [achievement] = await db.insert(achievements).values(insertAchievement).returning();
    return achievement;
  }

  // Stats
  async getTotalSaved(userId: string): Promise<number> {
    const archivedItems = await this.getItems(userId, undefined, true);
    return archivedItems.reduce((total, item) => total + Number(item.price), 0);
  }

  async getStats(userId: string): Promise<{
    activeItems: number;
    dueReview: number;
    archivedItems: number;
    totalSaved: number;
  }> {
    const allItems = await this.getItems(userId);
    const activeItems = allItems.filter(item => !item.isArchived).length;
    const archivedItems = allItems.filter(item => item.isArchived).length;
    const dueReviews = await this.getDueReviews(userId);
    const totalSaved = await this.getTotalSaved(userId);

    return {
      activeItems,
      dueReview: dueReviews.length,
      archivedItems,
      totalSaved,
    };
  }
}

export const storage = new DatabaseStorage();