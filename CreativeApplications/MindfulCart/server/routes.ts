import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { aiService } from "./services/aiService";
import { schedulerService } from "./services/schedulerService";
import { 
  insertFolderSchema, 
  insertItemSchema, 
  insertReviewSchema,
  insertCustomQuestionSchema 
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Start the scheduler service
  schedulerService.start();

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Folders
  app.get("/api/folders", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const folders = await storage.getFolders(userId);
      
      // Add item counts for each folder
      const foldersWithCounts = await Promise.all(
        folders.map(async (folder) => {
          const items = await storage.getItems(userId, folder.id, false);
          return { ...folder, itemCount: items.length };
        })
      );
      
      res.json(foldersWithCounts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch folders" });
    }
  });

  app.post("/api/folders", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const folderData = insertFolderSchema.parse(req.body);
      const folder = await storage.createFolder({ ...folderData, userId });
      res.json(folder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid folder data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create folder" });
      }
    }
  });

  app.put("/api/folders/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const updates = insertFolderSchema.partial().parse(req.body);
      const folder = await storage.updateFolder(id, userId, updates);
      
      if (!folder) {
        return res.status(404).json({ message: "Folder not found" });
      }
      
      res.json(folder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid folder data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update folder" });
      }
    }
  });

  app.delete("/api/folders/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const success = await storage.deleteFolder(id, userId);
      
      if (!success) {
        return res.status(404).json({ message: "Folder not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete folder" });
    }
  });

  // Items
  app.get("/api/items", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { folderId, isArchived } = req.query;
      const archived = isArchived === "true" ? true : isArchived === "false" ? false : undefined;
      
      const items = await storage.getItems(
        userId,
        folderId as string,
        archived
      );
      
      // Add review progress and status for each item
      const itemsWithProgress = await Promise.all(
        items.map(async (item) => {
          const reviews = await storage.getReviews(userId, item.id);
          const totalReviews = reviews.length;
          const completedReviews = reviews.filter(r => r.isCompleted).length;
          const dueReviews = reviews.filter(r => !r.isCompleted && r.scheduledFor <= new Date());
          
          return {
            ...item,
            reviewProgress: {
              completed: completedReviews,
              total: totalReviews,
              percentage: totalReviews > 0 ? (completedReviews / totalReviews) * 100 : 0,
            },
            isDueForReview: dueReviews.length > 0,
            nextReview: reviews
              .filter(r => !r.isCompleted)
              .sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime())[0]?.scheduledFor,
          };
        })
      );
      
      res.json(itemsWithProgress);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch items" });
    }
  });

  app.get("/api/items/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const item = await storage.getItem(id, userId);
      
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch item" });
    }
  });

  app.post("/api/items", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const itemData = insertItemSchema.parse(req.body);
      const item = await storage.createItem({ ...itemData, userId });
      
      res.json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid item data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create item" });
      }
    }
  });

  app.put("/api/items/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const updates = insertItemSchema.partial().parse(req.body);
      const item = await storage.updateItem(id, userId, updates);
      
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      res.json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid item data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update item" });
      }
    }
  });

  app.post("/api/items/:id/archive", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const { reason } = req.body;
      
      if (!reason) {
        return res.status(400).json({ message: "Archive reason is required" });
      }
      
      const item = await storage.archiveItem(id, userId, reason);
      
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to archive item" });
    }
  });

  app.delete("/api/items/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const success = await storage.deleteItem(id, userId);
      
      if (!success) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete item" });
    }
  });

  // Reviews
  app.get("/api/reviews/due", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const dueReviews = await storage.getDueReviews(userId);
      
      // Add item details to each review
      const reviewsWithItems = await Promise.all(
        dueReviews.map(async (review) => {
          const item = await storage.getItem(review.itemId, userId);
          return { ...review, item };
        })
      );
      
      res.json(reviewsWithItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch due reviews" });
    }
  });

  app.get("/api/reviews/:itemId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { itemId } = req.params;
      const reviews = await storage.getReviews(userId, itemId);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.post("/api/reviews/:id/complete", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const { responses, decision } = req.body;
      
      const review = await storage.updateReview(id, userId, {
        responses,
        decision,
        isCompleted: true,
        completedAt: new Date(),
      });
      
      if (!review) {
        return res.status(404).json({ message: "Review not found" });
      }
      
      // If decision is to archive, archive the item
      if (decision === "archive") {
        await storage.archiveItem(review.itemId, userId, "Decided during review process");
      }
      
      res.json(review);
    } catch (error) {
      res.status(500).json({ message: "Failed to complete review" });
    }
  });

  // Custom Questions
  app.get("/api/questions/:itemId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { itemId } = req.params;
      const questions = await storage.getCustomQuestions(itemId, userId);
      res.json(questions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch custom questions" });
    }
  });

  app.post("/api/questions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const questionData = insertCustomQuestionSchema.parse(req.body);
      const question = await storage.createCustomQuestion({ ...questionData, userId });
      res.json(question);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid question data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create question" });
      }
    }
  });

  // AI Services
  app.post("/api/ai/analyze-price", async (req, res) => {
    try {
      const { itemName, currentPrice, productUrl } = req.body;
      
      if (!itemName || !currentPrice) {
        return res.status(400).json({ message: "Item name and current price are required" });
      }
      
      const analysis = await aiService.analyzePriceAndAlternatives(
        itemName,
        currentPrice,
        productUrl
      );
      
      res.json(analysis);
    } catch (error) {
      res.status(500).json({ message: "Failed to analyze price" });
    }
  });

  app.post("/api/ai/analyze-sustainability", async (req, res) => {
    try {
      const { itemName, description } = req.body;
      
      if (!itemName) {
        return res.status(400).json({ message: "Item name is required" });
      }
      
      const analysis = await aiService.analyzeSustainability(itemName, description);
      res.json(analysis);
    } catch (error) {
      res.status(500).json({ message: "Failed to analyze sustainability" });
    }
  });

  app.post("/api/ai/generate-questions", async (req, res) => {
    try {
      const { itemName, reviewType, userNotes } = req.body;
      
      if (!itemName || !reviewType) {
        return res.status(400).json({ message: "Item name and review type are required" });
      }
      
      const questions = await aiService.generateCustomQuestions(itemName, reviewType, userNotes);
      res.json({ questions });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate questions" });
    }
  });

  // Stats and Achievements
  app.get("/api/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getStats(userId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get("/api/achievements", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const achievements = await storage.getAchievements(userId);
      res.json(achievements);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch achievements" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
