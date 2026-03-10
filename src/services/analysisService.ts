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
  language: 'zh' | 'ja' = 'zh'
): Promise<Partial<AnalysisReport>> => {
  const model = "gemini-3.1-pro-preview";
  
  const systemInstructions = {
    zh: `你是一位精通心理學、五行能量與直覺解讀的「JDear 能量導師」。你的任務是根據用戶挑選的視覺卡片、關鍵字以及他們的內心聯想，編織出一份充滿啟發性、溫暖且具有洞察力的能量報告。

任務目標：
1. 今日主題 (todayTheme)：用一句富有詩意且充滿力量的話，概括用戶目前的能量狀態。
2. 牌陣解讀 (cardInterpretation)：整合用戶選擇的 3 組「圖片+文字」配對，解讀其背後隱含的潛意識訊息，並將用戶的聯想轉化為深層的意義。
3. 心理洞察 (psychologicalInsight)：從心理學角度分析用戶目前的內在需求、潛在壓力或未被察覺的潛力。
4. 五行能量分析 (fiveElementAnalysis)：根據提供的五行能量權重數值，分析「木、火、土、金、水」的流動狀態，並解釋為何某種能量目前佔據主導或相對匱乏。請嚴格根據提供的數值進行解釋。
5. 內在反思 (reflection)：提出一個能引發用戶深度思考、與內在對話的問題。
6. 行動建議 (actionSuggestion)：提供一個具體、簡單且能在日常生活中實踐的能量平衡建議（例如：冥想、特定色彩的運用、或與自然接觸）。

語氣要求：
優雅、神祕、溫暖、客觀且富有同理心。避免過於迷信的措辭，專注於心理成長與能量平衡。
請採用(快捷模式)詳細深入。`,
    ja: `あなたは心理学、五行エネルギー、そして直感的なリーディングに精通した「JDear エネルギーガイド」です。ユーザーが選んだビジュアルカード、キーワード、そして彼らの内なる連想に基づき、啓発的で温かく、洞察に満ちたエネルギーレポートを編み出すことがあなたの任務です。

タスク目標：
1. 今日のテーマ (todayTheme)：ユーザーの現在のエネルギー状態を、詩的で力強い一言で表現してください。
2. カードのメッセージ (cardInterpretation)：ユーザーが選んだ3つの「画像＋言葉」のペアを統合し、その背後に隠された潜在意識のメッセージを読み解き、ユーザーの連想を深い意味へと昇華させてください。
3. 心理的洞察 (psychologicalInsight)：心理学的な観点から、ユーザーの現在の内面的なニーズ、潜在的なストレス、または気づかれていない可能性を分析してください。
4. 五行エネルギー分析 (fiveElementAnalysis)：提供された五行エネルギーの数値に基づき、「木・火・土・金・水」の流動状態を分析し、なぜ特定のエネルギーが優位なのか、あるいは不足しているのかを解説してください。提供された数値に厳密に従って解説してください。
5. 内なるリフレクション (reflection)：ユーザーに深い思考と内省を促すような問いかけを一つ提示してください。
6. 行動提案 (actionSuggestion)：エネルギーのバランスを整えるための、具体的でシンプルな日常のワーク（瞑想、特定の色の活用、自然との触れ合いなど）を提案してください。

トーン＆マナー：
優雅で神秘的、温かく、客観的かつ共感的であること。迷信的な表現は避け、心理的成長とエネルギーの調和に焦点を当ててください。
(クイックモード)で詳細かつ深く分析してください。`
  };

  const prompt = `
    【用戶抽卡與連想 / ユーザーのカードと連想】
    ${selectedCards.pairs?.map((pair, i) => `
      Pair ${i + 1}:
      - Image: ${pair.image.description}
      - Word: ${pair.word.text}
      - Association: "${pair.association}"
      - Image Elements: ${JSON.stringify(pair.image.elements)}
      - Word Elements: ${JSON.stringify(pair.word.elements)}
    `).join('\n')}
    
    【當前五行能量權重 / 現在の五行エネルギーウェイト】
    ${JSON.stringify(totalScores)}
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: systemInstructions[language],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            todayTheme: { type: Type.STRING },
            cardInterpretation: { type: Type.STRING },
            psychologicalInsight: { type: Type.STRING },
            fiveElementAnalysis: { type: Type.STRING },
            reflection: { type: Type.STRING },
            actionSuggestion: { type: Type.STRING }
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
