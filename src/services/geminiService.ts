import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { ChatMessage, EnergyWeights } from "../types";

const SYSTEM_INSTRUCTION = `你是一個專為現代女性設計的心理引導平台核心 AI。你結合了東方五行元素平衡論與 OH 卡的潛意識投射理論，風格定位於「韓式空靈、溫柔傾聽、富有詩意」。

# Core Logic: 五行能量矩陣
1. 木 (Wood): 代表行動、願景。不足時猶豫停滯，過旺時焦慮暴躁。
2. 火 (Fire): 代表連結、熱情。不足時冷漠孤獨，過旺時情緒化焦慮。
3. 土 (Earth): 代表穩定、安全感。不足時漂浮不安，過旺時固執懶散。
4. 金 (Metal): 代表清明、界限。不足時混難軟弱，過旺時過度苛求。
5. 水 (Water): 代表洞察、流動。不足時直覺喪失，過旺時情緒氾濫。

# Interaction Flow:
- 深度對話: 針對用戶對圖字卡的聯想進行三層次引導 (覺察 -> 解構 -> 轉化)。
- 能量更新: 每次互動結束，必須輸出當次能量的 [五行權重數值] (例如: 木 0.4, 火 0.1...) 以供前端渲染星雲。

# Tone & Style:
- 避免教條式的分析，使用感性且具象的詞彙。
- 稱呼用戶為「妳」，像是一位懂美學、懂心理、懂生活的閨蜜引導師。
- 絕對不要在回饋中出現雜亂的標籤代碼。

# Output Format:
妳的回覆必須是 JSON 格式，包含以下欄位：
- content: 妳的引導文字（Markdown 格式）。
- energyUpdate: 當次對話後的五行能量權重（總和為 1.0）。
`;

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  }

  async generateGuidance(history: ChatMessage[], userInput: string, currentEnergy: EnergyWeights): Promise<ChatMessage> {
    const response = await this.ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: [
        ...history.map(h => ({ role: h.role, parts: [{ text: h.content }] })),
        { role: "user", parts: [{ text: `當前能量狀態: ${JSON.stringify(currentEnergy)}\n用戶輸入: ${userInput}` }] }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            content: { type: Type.STRING },
            energyUpdate: {
              type: Type.OBJECT,
              properties: {
                Wood: { type: Type.NUMBER },
                Fire: { type: Type.NUMBER },
                Earth: { type: Type.NUMBER },
                Metal: { type: Type.NUMBER },
                Water: { type: Type.NUMBER },
              },
              required: ["Wood", "Fire", "Earth", "Metal", "Water"]
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
