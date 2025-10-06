import { storage } from "../storage";
import { aiService } from "./aiService";

export class SchedulerService {
  private intervals: NodeJS.Timeout[] = [];

  start() {
    // Check for due reviews every hour
    const interval = setInterval(async () => {
      await this.processDueReviews();
    }, 60 * 60 * 1000); // 1 hour

    this.intervals.push(interval);
    
    // Run initial check
    this.processDueReviews();
  }

  stop() {
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];
  }

  private async processDueReviews() {
    try {
      const dueReviews = await storage.getDueReviews();
      
      for (const review of dueReviews) {
        const item = await storage.getItem(review.itemId);
        if (!item || item.isArchived) continue;

        // Update item with AI analysis if price tracking is enabled
        if (item.aiFeatures?.priceTracking) {
          try {
            const analysis = await aiService.analyzePriceAndAlternatives(
              item.name,
              Number(item.currentPrice || item.price),
              item.productUrl || undefined
            );

            // Update current price and add to history
            const newPriceHistory = [...(item.priceHistory || [])];
            if (analysis.currentPrice !== Number(item.currentPrice)) {
              newPriceHistory.push({
                price: analysis.currentPrice,
                date: new Date().toISOString()
              });
            }

            await storage.updateItem(review.itemId, {
              currentPrice: analysis.currentPrice.toString(),
              priceHistory: newPriceHistory,
            });
          } catch (error) {
            console.error(`Failed to update price for item ${item.name}:`, error);
          }
        }
      }
    } catch (error) {
      console.error("Failed to process due reviews:", error);
    }
  }

  async scheduleReviewsForItem(itemId: string, reviewSchedule: string[]) {
    const scheduleMap: Record<string, number> = {
      "1day": 1,
      "1week": 7,
      "1month": 30,
      "3months": 90,
      "6months": 180,
      "1year": 365,
    };

    for (const reviewType of reviewSchedule) {
      const days = scheduleMap[reviewType];
      if (!days) continue;

      const scheduledFor = new Date();
      scheduledFor.setDate(scheduledFor.getDate() + days);

      await storage.createReview({
        itemId,
        scheduledFor,
        reviewType,
        isCompleted: false,
        responses: {},
        completedAt: null,
        decision: null,
      });
    }
  }
}

export const schedulerService = new SchedulerService();
