import { GoogleGenAI, Type } from "@google/genai";
import { SelectedCards, AnalysisReport, FiveElementValues, AIPrompt } from "../core/types";

// Initialize AI with the environment variable
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

/**
 * Generates an AI-driven energy analysis report using Gemini.
 * Analyzes card pairs, user associations, and five element values.
 */
export const generateAIAnalysis = async (
  selectedCards: SelectedCards,
  totalScores: FiveElementValues,
  lang: 'zh-TW' | 'ja' = 'zh-TW'
): Promise<Partial<AnalysisReport>> => {
  const model = "gemini-3.1-pro-preview";
  
  // Fetch active prompt for the specific language
  let systemPrompt = "";
  try {
    const response = await fetch('/api/admin/prompts');
    if (response.ok) {
      const prompts: AIPrompt[] = await response.json();
      const activePrompt = prompts.find(p => p.status === 'active' && p.lang === lang);
      if (activePrompt) {
        systemPrompt = activePrompt.prompt_content;
      }
    }
  } catch (error) {
    console.error("Failed to fetch active prompt:", error);
  }

  // Fallback default prompt if none found in DB
  if (!systemPrompt) {
    if (lang === 'ja') {
      systemPrompt = `
        あなたは現代女性のために設計された「五行エネルギーバランス・ガイド」です。東洋の五行説とOHカードの潜在意識投影理論を組み合わせ、スタイルは「韓国風の透明感、優しい傾聴、詩的」です。
        
        以下のユーザーの引き当てたカードの結果、連想テキスト、および五行エネルギー数値に基づき、深いエネルギー分析レポートを作成してください。
        
        【トーンの要求】
        - ユーザーを「あなた」と呼んでください。
        - 優しく、透明感があり、美学を感じさせるトーンで、生活を理解している親友のように。
        - 教条的にならず、具体的で感性豊かな言葉を使用してください。
        - 返信は必ず日本語でお願いします。
      `;
    } else {
      systemPrompt = `
        妳是一位專為現代女性設計的「五行能量平衡引導師」。妳結合了東方五行元素平衡論與 OH 卡的潛意識投射理論，風格定位於「韓式空靈、溫柔傾聽、富有詩意」。
        
        請針對以下用戶的抽卡結果、連想文字以及五行能量數值，撰寫一份深度的能量分析報告。
        
        【語氣要求】
        - 使用「妳」來稱呼用戶。
        - 語氣溫柔、空靈、富有美學感，像是一位懂生活的閨蜜。
        - 避免教條，使用具象且感性的詞彙。
        - 回覆必須是繁體中文。
      `;
    }
  }
  
  const prompt = `
    ${systemPrompt}

    【用戶抽卡與連想 / ユーザーのカードと連想】
    ${selectedCards.pairs?.map((pair, i) => `
      配對 / ペア ${i + 1}:
      - 圖片描述 / 画像の説明: ${pair.image.description}
      - 文字卡 / テキストカード: ${pair.word.text}
      - 用戶連想 / ユーザーの連想: "${pair.association}"
      - 圖片五行 / 画像の五行: ${JSON.stringify(pair.image.elements)}
      - 文字五行 / テキストの五行: ${JSON.stringify(pair.word.elements)}
    `).join('\n')}
    
    【當前五行能量權重 (百分比) / 現在の五行エネルギーウェイト (%)】
    ${JSON.stringify(totalScores)}
    
    請根據以上資訊，完成以下六個部分的分析：
    1. 今日主題 (todayTheme): 用一段富有詩意的文字，為用戶當前的能量狀態定調。
    2. 牌陣解讀 (cardInterpretation): 深入分析圖片、文字與用戶連想之間的潛意識連結。
    3. 心理洞察 (psychologicalInsight): 透過連想文字，揭示用戶當前深層的心理需求或狀態。
    4. 五行能量分析 (fiveElementAnalysis): 針對優勢與不足的元素，解釋其對用戶生活（行動、情緒、關係等）的影響。
    5. 內在冥想/反思 (reflection): 提供一個引導用戶向內觀察的問題或冥想練習。
    6. 行動建議 (actionSuggestion): 給予具體、溫柔且可執行的生活建議，幫助能量回歸平衡。
  `;

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
