import { GoogleGenAI, Type } from "@google/genai";
import { SelectedCards, AnalysisReport, FiveElementValues } from "../core/types";

// Initialize AI with the environment variable
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

/**
 * Generates an AI-driven energy analysis report using Gemini.
 * Analyzes card pairs, user associations, and five element values.
 */
export const generateAIAnalysis = async (
  selectedCards: SelectedCards,
  totalScores: FiveElementValues,
  lang: 'zh' | 'ja' = 'zh'
): Promise<Partial<AnalysisReport>> => {
  const model = "gemini-3.1-pro-preview";
  
  // Map language code to database format
  const dbLang = lang === 'ja' ? 'ja-JP' : 'zh-TW';
  
  // Fetch active prompt from database
  let promptTemplate = "";
  try {
    const promptResponse = await fetch(`/api/prompts/active?category=analysis&lang=${dbLang}`);
    if (promptResponse.ok) {
      const activePrompt = await promptResponse.json();
      if (activePrompt && activePrompt.content) {
        promptTemplate = activePrompt.content;
      }
    }
  } catch (err) {
    console.warn("Failed to fetch active prompt, using fallback:", err);
  }

  // Fallback hardcoded prompt if no prompt found in DB
  if (!promptTemplate) {
    promptTemplate = `
      妳是一位專為現代女性設計的「五行能量平衡引導師」。妳結合了東方五行元素平衡論與 OH 卡的潛意識投射理論，風格定位於「韓式空靈、溫柔傾聽、富有詩意」。

      請針對以下用戶的抽卡結果、連想文字以及五行能量數值，撰寫一份深度的能量分析報告。

      【用戶抽卡與連想】
      {{USER_DATA}}
      
      【當前五行能量權重 (百分比)】
      {{ENERGY_DATA}}
      
      請根據以上資訊，完成以下分析：
      1. 今日主題 (todayTheme): 用一段富有詩意的文字，為用戶當前的能量狀態定調。
      2. 牌陣解讀 (cardInterpretation): 深入分析圖片、文字與用戶連想之間的潛意識連結。
      3. 心理洞察 (psychologicalInsight): 透過連想文字，揭示用戶當前深層的心理需求或狀態。
      4. 五行能量分析 (fiveElementAnalysis): 針對優勢與不足的元素，解釋其對用戶生活（行動、情緒、關係等）的影響。
      5. 內在冥想/反思 (reflection): 提供一個引導用戶向內觀察的問題或冥想練習。
      6. 行動建議 (actionSuggestion): 給予具體、溫柔且可執行的生活建議，幫助能量回歸平衡。
      7. 針對每一組牌卡配對，提供一段簡短的深度解析 (pairInterpretations): 必須包含 3 組，每組包含 pair_id (0, 1, 2) 與對應的解析文字 text。

      【語氣要求】
      - 使用「妳」來稱呼用戶。
      - 語氣溫柔、空靈、富有美學感，像是一位懂生活的閨蜜。
      - 避免教條，使用具象且感性的詞彙。
      - 回覆必須是繁體中文。
    `;
  }

  const userData = selectedCards.pairs?.map((pair, i) => `
    配對 ${i + 1}:
    - 圖片描述: ${pair.image.description}
    - 文字卡: ${pair.word.text}
    - 用戶連想: "${pair.association}"
    - 圖片五行: ${JSON.stringify(pair.image.elements)}
    - 文字五行: ${JSON.stringify(pair.word.elements)}
  `).join('\n');

  const prompt = promptTemplate
    .replace('{{USER_DATA}}', userData || "")
    .replace('{{ENERGY_DATA}}', JSON.stringify(totalScores));

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            todayTheme: { type: Type.STRING },
            cardInterpretation: { type: Type.STRING },
            psychologicalInsight: { type: Type.STRING },
            fiveElementAnalysis: { type: Type.STRING },
            reflection: { type: Type.STRING },
            actionSuggestion: { type: Type.STRING },
            pairInterpretations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  pair_id: { type: Type.STRING },
                  text: { type: Type.STRING }
                },
                required: ["pair_id", "text"]
              }
            }
          },
          required: ["todayTheme", "cardInterpretation", "psychologicalInsight", "fiveElementAnalysis", "reflection", "actionSuggestion"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from Gemini");
    
    return JSON.parse(text);
  } catch (error) {
    console.error("AI Analysis failed:", error);
    return {
      todayTheme: "在流動的時光中，尋找內心的平靜。",
      cardInterpretation: "妳選取的牌卡映照出妳內心深處對連結與成長的渴望。",
      psychologicalInsight: "當前的妳正處於一個轉化的階段，雖然有些微的焦慮，但更多的是對未來的期許。",
      fiveElementAnalysis: "能量的起伏是自然的律動，優勢的元素帶給妳力量，不足的元素則提醒妳停下腳步。 ",
      reflection: "閉上眼，感受呼吸的頻率，問問自己：現在的我，最需要什麼樣的擁抱？",
      actionSuggestion: "今天試著為自己泡一杯熱茶，在安靜的角落坐下，什麼都不做，只是存在。"
    };
  }
};
