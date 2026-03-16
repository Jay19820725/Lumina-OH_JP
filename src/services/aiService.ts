import { GoogleGenAI } from "@google/genai";

export const aiService = {
  async translateBottle(content: string, targetLang: 'zh' | 'ja'): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not set. Translation skipped.");
      return content;
    }

    const ai = new GoogleGenAI({ apiKey });
    const model = "gemini-3-flash-preview";
    
    const targetLangName = targetLang === 'zh' ? 'Traditional Chinese (zh-TW)' : 'Japanese (ja-JP)';
    
    const prompt = `Translate the following "message in a bottle" into ${targetLangName}. 
    Keep the tone healing, poetic, and gentle. 
    Only return the translated text, nothing else.
    
    Message: "${content}"`;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
      });
      return response.text || content;
    } catch (error) {
      console.error("AI Translation Error:", error);
      return content;
    }
  }
};
