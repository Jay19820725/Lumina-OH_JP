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
  
  // Fetch active prompt from database (preferring 'dual' language version)
  let promptTemplate = "";
  let styleInstruction = "";
  
  try {
    const promptResponse = await fetch(`/api/prompts/active?category=analysis&lang=dual`);
    if (promptResponse.ok) {
      const activePrompt = await promptResponse.json();
      if (activePrompt && (activePrompt.prompt_content || activePrompt.content)) {
        promptTemplate = activePrompt.prompt_content || activePrompt.content;
        
        // Construct style instruction from tags
        const styleMap: Record<string, string> = {
          gentle: "語氣溫柔、如閨蜜般傾聽。",
          ethereal: "風格空靈、富有靈性感。",
          poetic: "文字優美、富有詩意。",
          professional: "分析專業、條理清晰。",
          healing: "具備療癒感、給予正向能量。"
        };
        
        const tags = activePrompt.style_tags || [];
        styleInstruction = tags.map((t: string) => styleMap[t] || "").filter(Boolean).join(" ");
        
        if (tags.includes('custom') && activePrompt.custom_style_instruction) {
          styleInstruction += " " + activePrompt.custom_style_instruction;
        }
      }
    }
  } catch (err) {
    console.warn("Failed to fetch active dual prompt, using fallback:", err);
  }

  // Fallback hardcoded prompt if no prompt found in DB
  if (!promptTemplate) {
    promptTemplate = `
      妳是一位專為現代女性設計的「五行能量平衡引導師」。妳結合了東方五行元素平衡論與潛意識投射理論。
      
      請針對以下用戶的抽卡結果、連想文字以及五行能量數值，撰寫一份深度的能量分析報告。
      妳必須同時生成「繁體中文 (zh-TW)」與「日文 (ja-JP)」兩個版本。
      
      【用戶抽卡與連想】
      {{USER_DATA}}
      
      【當前五行能量權重 (百分比)】
      {{ENERGY_DATA}}
      
      【分析要求】
      1. 今日主題 (todayTheme): 富有詩意的能量定調。
      2. 牌陣解讀 (cardInterpretation): 潛意識連結分析。
      3. 心理洞察 (psychologicalInsight): 深層心理需求揭示。
      4. 五行能量分析 (fiveElementAnalysis): 元素對生活的影響。
      5. 內在冥想/反思 (reflection): 引導向內觀察。
      6. 行動建議 (actionSuggestion): 給予具體、溫柔且可執行的生活建議，幫助能量回歸平衡。
      7. 牌組解析 (pairInterpretations): 3 組配對的深度解析。

      【風格要求】
      {{STYLE_INSTRUCTION}}
      - 中文版必須是繁體中文。
      - 日文版必須優雅且感性。
    `;
    styleInstruction = "語氣溫柔、空靈、富有詩意，使用「妳」來稱呼用戶。";
  }

  const userData = selectedCards.pairs?.map((pair, i) => `
    配對 ${i + 1}:
    - 圖片描述: ${pair.image.description}
    - 文字卡: ${pair.word.text}
    - 用戶連想: "${pair.association}"
    - 圖片五行: ${JSON.stringify(pair.image.elements)}
    - 文字五行: ${JSON.stringify(pair.word.elements)}
  `).join('\n');

  const finalPrompt = promptTemplate
    .replace('{{USER_DATA}}', userData || "")
    .replace('{{ENERGY_DATA}}', JSON.stringify(totalScores))
    .replace('{{STYLE_INSTRUCTION}}', styleInstruction);

  try {
    const response = await ai.models.generateContent({
      model,
      contents: finalPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            "zh-TW": {
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
            },
            "ja-JP": {
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
          },
          required: ["zh-TW", "ja-JP"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from Gemini");
    
    const multilingualContent = JSON.parse(text);
    
    // For backward compatibility and immediate display, we also set the top-level fields
    // based on the current language or default to zh-TW
    const displayLang = currentLang === 'ja' ? 'ja-JP' : 'zh-TW';
    const currentContent = multilingualContent[displayLang] || multilingualContent['zh-TW'];

    return {
      ...currentContent,
      multilingualContent
    };
  } catch (error) {
    console.error("AI Analysis failed:", error);
    // Fallback static content
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
