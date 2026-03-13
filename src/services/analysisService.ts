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
  currentLang: 'zh' | 'ja' = 'zh'
): Promise<Partial<AnalysisReport>> => {
  const model = "gemini-3.1-pro-preview";
  
  // Fetch active prompt from database for the specific language
  let promptTemplate = "";
  
  try {
    const promptResponse = await fetch(`/api/prompts/active?lang=${currentLang}`);
    if (promptResponse.ok) {
      const activePrompt = await promptResponse.json();
      promptTemplate = activePrompt.content || "";
    }
  } catch (err) {
    console.warn("Failed to fetch active prompt, using fallback:", err);
  }

  // Fallback hardcoded prompt if no prompt found in DB
  if (!promptTemplate) {
    promptTemplate = `
      妳是一位專為現代女性設計的「五行能量平衡引導師」。妳結合了東方五行元素平衡論與潛意識投射理論。
      請針對以下用戶的抽卡結果、連想文字以及五行能量數值，撰寫一份深度的能量分析報告。
      請僅使用${currentLang === 'ja' ? '日文 (ja-JP)' : '繁體中文 (zh-TW)'}進行回覆。
      
      【用戶抽卡與連想】
      {{USER_DATA}}
      
      【當前五行能量權重】
      {{ENERGY_DATA}}
    `;
  }

  const userData = selectedCards.pairs?.map((pair, i) => `
    配對 ${i + 1}:
    - 圖片描述: ${pair.image.description}
    - 文字卡: ${pair.word.text}
    - 用戶連想: "${pair.association}"
  `).join('\n');

  const finalPrompt = promptTemplate
    .replace('{{USER_DATA}}', userData || "")
    .replace('{{ENERGY_DATA}}', JSON.stringify(totalScores));

  try {
    const response = await ai.models.generateContent({
      model,
      contents: finalPrompt,
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
    
    const content = JSON.parse(text);
    
    return {
      ...content,
      lang: currentLang // Store the language tag
    };
  } catch (error) {
    console.error("AI Analysis failed:", error);
    // Fallback static content
    return {
      todayTheme: currentLang === 'ja' ? "流れる時の中で、心の平穏を見つける。" : "在流動的時光中，尋找內心的平靜。",
      cardInterpretation: currentLang === 'ja' ? "あなたが選んだカードは、心の奥底にある繋がりと成長への渇望を映し出しています。" : "妳選取的牌卡映照出妳內心深處對連結與成長的渴望。",
      psychologicalInsight: currentLang === 'ja' ? "現在のあなたは変化の段階にあります。わずかな不安はあるものの、それ以上に未来への期待が大きいです。" : "當前的妳正處於一個轉化的階段，雖然有些微的焦慮，但更多的是對未來的期許。",
      fiveElementAnalysis: currentLang === 'ja' ? "エネルギーの浮き沈みは自然なリズムです。優勢な要素はあなたに力を与え、不足している要素は立ち止まることを教えてくれます。" : "能量的起伏是自然的律動，優勢的元素帶給妳力量，不足的元素則提醒妳停下腳步。 ",
      reflection: currentLang === 'ja' ? "目を閉じて、呼吸の頻度を感じてみてください。自分に問いかけてみましょう：今の私に、最も必要な抱擁は何ですか？" : "閉上眼，感受呼吸的頻率，問問自己：現在的我，最需要什麼樣的擁抱？",
      actionSuggestion: currentLang === 'ja' ? "今日は自分のために温かいお茶を淹れ、静かな場所で座ってみてください。何もしなくていい、ただそこにいるだけで。" : "今天試著為自己泡一杯熱茶，在安靜的角落坐下，什麼都不做，只是存在。"
    };
  }
};
