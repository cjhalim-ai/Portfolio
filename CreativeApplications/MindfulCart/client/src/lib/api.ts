import { apiRequest } from "./queryClient";

export interface ItemWithProgress {
  id: string;
  name: string;
  description?: string;
  price: string;
  currentPrice?: string;
  productUrl?: string;
  notes?: string;
  folderId?: string;
  isArchived: boolean;
  reviewSchedule: string[];
  aiFeatures: {
    priceTracking: boolean;
    alternatives: boolean;
    sustainability: boolean;
  };
  priceHistory: Array<{ price: number; date: string }>;
  createdAt: Date;
  archivedAt?: Date;
  archivedReason?: string;
  reviewProgress: {
    completed: number;
    total: number;
    percentage: number;
  };
  isDueForReview: boolean;
  nextReview?: Date;
}

export interface FolderWithCount {
  id: string;
  name: string;
  color?: string;
  itemCount: number;
  createdAt: Date;
}

export interface Stats {
  activeItems: number;
  dueReview: number;
  archivedItems: number;
  totalSaved: number;
}

export interface ReviewWithItem {
  id: string;
  itemId: string;
  scheduledFor: Date;
  completedAt?: Date;
  reviewType: string;
  isCompleted: boolean;
  responses: Record<string, any>;
  decision?: string;
  createdAt: Date;
  item?: ItemWithProgress;
}

export interface PriceAnalysis {
  currentPrice: number;
  trend: "up" | "down" | "stable";
  priceChange: number;
  confidence: number;
  recommendation: string;
  alternatives?: Array<{
    name: string;
    price: number;
    reason: string;
  }>;
}

export interface SustainabilityAnalysis {
  rating: number;
  factors: string[];
  recommendation: string;
  alternatives?: string[];
}

export const api = {
  // Folders
  async getFolders(): Promise<FolderWithCount[]> {
    const res = await apiRequest("GET", "/api/folders");
    return res.json();
  },

  async createFolder(data: { name: string; color?: string }) {
    const res = await apiRequest("POST", "/api/folders", data);
    return res.json();
  },

  async updateFolder(id: string, data: Partial<{ name: string; color: string }>) {
    const res = await apiRequest("PUT", `/api/folders/${id}`, data);
    return res.json();
  },

  async deleteFolder(id: string) {
    const res = await apiRequest("DELETE", `/api/folders/${id}`);
    return res.json();
  },

  // Items
  async getItems(folderId?: string, isArchived?: boolean): Promise<ItemWithProgress[]> {
    const params = new URLSearchParams();
    if (folderId) params.append("folderId", folderId);
    if (isArchived !== undefined) params.append("isArchived", isArchived.toString());
    
    const url = `/api/items${params.toString() ? `?${params}` : ""}`;
    const res = await apiRequest("GET", url);
    return res.json();
  },

  async getItem(id: string): Promise<ItemWithProgress> {
    const res = await apiRequest("GET", `/api/items/${id}`);
    return res.json();
  },

  async createItem(data: {
    name: string;
    description?: string;
    price: string;
    productUrl?: string;
    notes?: string;
    folderId?: string;
    reviewSchedule: string[];
    aiFeatures: {
      priceTracking: boolean;
      alternatives: boolean;
      sustainability: boolean;
    };
  }) {
    const res = await apiRequest("POST", "/api/items", data);
    return res.json();
  },

  async updateItem(id: string, data: Partial<{
    name: string;
    description: string;
    price: string;
    productUrl: string;
    notes: string;
    folderId: string;
    reviewSchedule: string[];
    aiFeatures: {
      priceTracking: boolean;
      alternatives: boolean;
      sustainability: boolean;
    };
  }>) {
    const res = await apiRequest("PUT", `/api/items/${id}`, data);
    return res.json();
  },

  async archiveItem(id: string, reason: string) {
    const res = await apiRequest("POST", `/api/items/${id}/archive`, { reason });
    return res.json();
  },

  async deleteItem(id: string) {
    const res = await apiRequest("DELETE", `/api/items/${id}`);
    return res.json();
  },

  // Reviews
  async getDueReviews(): Promise<ReviewWithItem[]> {
    const res = await apiRequest("GET", "/api/reviews/due");
    return res.json();
  },

  async getReviews(itemId: string) {
    const res = await apiRequest("GET", `/api/reviews/${itemId}`);
    return res.json();
  },

  async completeReview(id: string, data: {
    responses: Record<string, any>;
    decision: "keep" | "archive" | "purchase";
  }) {
    const res = await apiRequest("POST", `/api/reviews/${id}/complete`, data);
    return res.json();
  },

  // AI Services
  async analyzePriceAndAlternatives(itemName: string, currentPrice: number, productUrl?: string): Promise<PriceAnalysis> {
    const res = await apiRequest("POST", "/api/ai/analyze-price", {
      itemName,
      currentPrice,
      productUrl,
    });
    return res.json();
  },

  async analyzeSustainability(itemName: string, description?: string): Promise<SustainabilityAnalysis> {
    const res = await apiRequest("POST", "/api/ai/analyze-sustainability", {
      itemName,
      description,
    });
    return res.json();
  },

  async generateCustomQuestions(itemName: string, reviewType: string, userNotes?: string): Promise<{ questions: string[] }> {
    const res = await apiRequest("POST", "/api/ai/generate-questions", {
      itemName,
      reviewType,
      userNotes,
    });
    return res.json();
  },

  // Stats
  async getStats(): Promise<Stats> {
    const res = await apiRequest("GET", "/api/stats");
    return res.json();
  },

  async getAchievements() {
    const res = await apiRequest("GET", "/api/achievements");
    return res.json();
  },
};
