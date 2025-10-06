import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key" 
});

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

export class AIService {
  async analyzePriceAndAlternatives(
    itemName: string,
    currentPrice: number,
    productUrl?: string
  ): Promise<PriceAnalysis> {
    try {
      const prompt = `Analyze the price and suggest alternatives for this product:
      Item: ${itemName}
      Current Price: $${currentPrice}
      URL: ${productUrl || "Not provided"}
      
      Provide analysis in JSON format with:
      - currentPrice: number
      - trend: "up" | "down" | "stable" 
      - priceChange: number (positive for increase, negative for decrease)
      - confidence: number (0-1)
      - recommendation: string
      - alternatives: array of {name, price, reason}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a price analysis expert. Provide realistic market analysis and suggest practical alternatives."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      return {
        currentPrice: result.currentPrice || currentPrice,
        trend: result.trend || "stable",
        priceChange: result.priceChange || 0,
        confidence: Math.max(0, Math.min(1, result.confidence || 0.5)),
        recommendation: result.recommendation || "Monitor for price changes",
        alternatives: result.alternatives || [],
      };
    } catch (error) {
      console.error("AI price analysis failed:", error);
      return {
        currentPrice,
        trend: "stable",
        priceChange: 0,
        confidence: 0,
        recommendation: "Unable to analyze price at this time",
        alternatives: [],
      };
    }
  }

  async analyzeSustainability(
    itemName: string,
    description?: string
  ): Promise<SustainabilityAnalysis> {
    try {
      const prompt = `Analyze the sustainability impact of this product:
      Item: ${itemName}
      Description: ${description || "Not provided"}
      
      Provide analysis in JSON format with:
      - rating: number (1-5, where 5 is most sustainable)
      - factors: array of strings (environmental considerations)
      - recommendation: string
      - alternatives: array of more sustainable options`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a sustainability expert. Analyze products for environmental impact and ethical considerations."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      return {
        rating: Math.max(1, Math.min(5, result.rating || 3)),
        factors: result.factors || ["Unable to analyze sustainability factors"],
        recommendation: result.recommendation || "Consider the long-term environmental impact",
        alternatives: result.alternatives || [],
      };
    } catch (error) {
      console.error("AI sustainability analysis failed:", error);
      return {
        rating: 3,
        factors: ["Analysis unavailable"],
        recommendation: "Consider researching the product's environmental impact",
        alternatives: [],
      };
    }
  }

  async generateCustomQuestions(
    itemName: string,
    reviewType: string,
    userNotes?: string
  ): Promise<string[]> {
    try {
      const prompt = `Generate thoughtful reflection questions for a ${reviewType} review of this item:
      Item: ${itemName}
      User Notes: ${userNotes || "None"}
      
      Provide 2-3 personalized questions in JSON format as an array of strings.
      Questions should encourage mindful consumption and self-reflection.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a mindfulness coach helping people make thoughtful purchasing decisions. Generate introspective questions."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return result.questions || [
        "Do you still feel the same excitement about this item?",
        "How would owning this item align with your current priorities?",
        "What would you do with the money if you didn't buy this?"
      ];
    } catch (error) {
      console.error("AI question generation failed:", error);
      return [
        "Do you still want this item as much as when you first added it?",
        "Have your priorities changed since adding this to your wishlist?",
        "How often would you realistically use this item?"
      ];
    }
  }
}

export const aiService = new AIService();
