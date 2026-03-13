import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { ChatMessage, FiveElementValues } from "../core/types";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  }

  private async fetchSystemInstruction(lang: string): Promise<string> {
    try {
      const response = await fetch(`/api/prompts/active?lang=${lang}`);
      if (!response.ok) throw new Error("Failed to fetch prompt");
      const data = await response.json();
      return data.content || "";
    } catch (error) {
      console.error("Error fetching system instruction:", error);
      // Fallback to a minimal instruction if API fails
      return "You are EUNIE, a psychological guide. Please respond in the requested language.";
    }
  }

  async generateGuidance(history: ChatMessage[], userInput: string, currentEnergy: FiveElementValues, lang: string = 'zh'): Promise<ChatMessage> {
    const systemInstruction = await this.fetchSystemInstruction(lang);

    const response = await this.ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: [
        ...history.map(h => ({ role: h.role, parts: [{ text: h.content }] })),
        { role: "user", parts: [{ text: `當前能量狀態: ${JSON.stringify(currentEnergy)}\n用戶輸入: ${userInput}` }] }
      ],
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            content: { type: Type.STRING },
            energyUpdate: {
              type: Type.OBJECT,
              properties: {
                wood: { type: Type.NUMBER },
                fire: { type: Type.NUMBER },
                earth: { type: Type.NUMBER },
                metal: { type: Type.NUMBER },
                water: { type: Type.NUMBER },
              },
              required: ["wood", "fire", "earth", "metal", "water"]
            }
          },
          required: ["content", "energyUpdate"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    return {
      role: "model",
      content: result.content,
      energyUpdate: result.energyUpdate
    };
  }
}

export const geminiService = new GeminiService();
