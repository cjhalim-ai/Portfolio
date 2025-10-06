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
import { eq, and } from "drizzle-orm";

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
    return result.rowCount > 0;
  }

  // Items
  async getItems(folderId?: string, isArchived?: boolean): Promise<Item[]> {
    let items = Array.from(this.items.values());
    
    if (folderId) {
      items = items.filter(item => item.folderId === folderId);
    }
    
    if (isArchived !== undefined) {
      items = items.filter(item => item.isArchived === isArchived);
    }
    
    return items;
  }

  async getItem(id: string): Promise<Item | undefined> {
    return this.items.get(id);
  }

  async createItem(insertItem: InsertItem): Promise<Item> {
    const id = randomUUID();
    const item: Item = {
      ...insertItem,
      id,
      isArchived: false,
      currentPrice: insertItem.price,
      priceHistory: [{ price: Number(insertItem.price), date: new Date().toISOString() }],
      createdAt: new Date(),
      archivedAt: null,
      archivedReason: null,
    };
    this.items.set(id, item);
    
    // Create initial reviews based on schedule
    if (insertItem.reviewSchedule) {
      for (const reviewType of insertItem.reviewSchedule) {
        await this.createReviewForSchedule(id, reviewType);
      }
    }
    
    return item;
  }

  private async createReviewForSchedule(itemId: string, reviewType: string): Promise<void> {
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
      itemId,
      scheduledFor,
      reviewType,
      isCompleted: false,
      responses: {},
      completedAt: null,
      decision: null,
    });
  }

  async updateItem(id: string, updates: Partial<InsertItem>): Promise<Item | undefined> {
    const item = this.items.get(id);
    if (!item) return undefined;
    
    const updatedItem = { ...item, ...updates };
    this.items.set(id, updatedItem);
    return updatedItem;
  }

  async deleteItem(id: string): Promise<boolean> {
    return this.items.delete(id);
  }

  async archiveItem(id: string, reason: string): Promise<Item | undefined> {
    const item = this.items.get(id);
    if (!item) return undefined;
    
    const updatedItem = {
      ...item,
      isArchived: true,
      archivedAt: new Date(),
      archivedReason: reason,
    };
    this.items.set(id, updatedItem);
    
    // Create achievement for money saved
    await this.createAchievement({
      type: "money_saved",
      title: "Mindful Decision",
      description: `You saved $${item.price} by thoughtfully deciding not to purchase ${item.name}`,
      value: item.price,
    });
    
    return updatedItem;
  }

  // Reviews
  async getReviews(itemId?: string): Promise<Review[]> {
    let reviews = Array.from(this.reviews.values());
    if (itemId) {
      reviews = reviews.filter(review => review.itemId === itemId);
    }
    return reviews;
  }

  async getReview(id: string): Promise<Review | undefined> {
    return this.reviews.get(id);
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const id = randomUUID();
    const review: Review = {
      ...insertReview,
      id,
      createdAt: new Date(),
    };
    this.reviews.set(id, review);
    return review;
  }

  async updateReview(id: string, updates: Partial<InsertReview>): Promise<Review | undefined> {
    const review = this.reviews.get(id);
    if (!review) return undefined;
    
    const updatedReview = { ...review, ...updates };
    this.reviews.set(id, updatedReview);
    return updatedReview;
  }

  async getDueReviews(): Promise<Review[]> {
    const now = new Date();
    return Array.from(this.reviews.values()).filter(
      review => !review.isCompleted && review.scheduledFor <= now
    );
  }

  async getReviewsByType(reviewType: string): Promise<Review[]> {
    return Array.from(this.reviews.values()).filter(
      review => review.reviewType === reviewType
    );
  }

  // Custom Questions
  async getCustomQuestions(itemId: string): Promise<CustomQuestion[]> {
    return Array.from(this.customQuestions.values()).filter(
      question => question.itemId === itemId
    );
  }

  async createCustomQuestion(insertQuestion: InsertCustomQuestion): Promise<CustomQuestion> {
    const id = randomUUID();
    const question: CustomQuestion = {
      ...insertQuestion,
      id,
      createdAt: new Date(),
    };
    this.customQuestions.set(id, question);
    return question;
  }

  async deleteCustomQuestion(id: string): Promise<boolean> {
    return this.customQuestions.delete(id);
  }

  // Achievements
  async getAchievements(): Promise<Achievement[]> {
    return Array.from(this.achievements.values());
  }

  async createAchievement(insertAchievement: InsertAchievement): Promise<Achievement> {
    const id = randomUUID();
    const achievement: Achievement = {
      ...insertAchievement,
      id,
      unlockedAt: new Date(),
    };
    this.achievements.set(id, achievement);
    return achievement;
  }

  // Stats
  async getTotalSaved(): Promise<number> {
    const archivedItems = Array.from(this.items.values()).filter(item => item.isArchived);
    return archivedItems.reduce((total, item) => total + Number(item.price), 0);
  }

  async getStats(): Promise<{
    activeItems: number;
    dueReview: number;
    archivedItems: number;
    totalSaved: number;
  }> {
    const items = Array.from(this.items.values());
    const activeItems = items.filter(item => !item.isArchived).length;
    const archivedItems = items.filter(item => item.isArchived).length;
    const dueReviews = await this.getDueReviews();
    const totalSaved = await this.getTotalSaved();

    return {
      activeItems,
      dueReview: dueReviews.length,
      archivedItems,
      totalSaved,
    };
  }
}

export const storage = new MemStorage();
