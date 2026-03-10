import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Fallback translations in case API fails
const resources = {
  'zh-TW': {
    translation: {
      "common": {
        "save": "儲存",
        "cancel": "取消",
        "loading": "讀取中...",
        "error": "錯誤"
      }
    }
  },
  'ja': {
    translation: {
      "common": {
        "save": "保存",
        "cancel": "キャンセル",
        "loading": "読み込み中...",
        "error": "エラー"
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'zh-TW',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['querystring', 'cookie', 'localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage', 'cookie'],
    }
  });

export const loadTranslations = async () => {
  try {
    const response = await fetch('/api/admin/translations');
    if (!response.ok) return;
    const translations = await response.json();
    
    const zh_tw: Record<string, string> = {};
    const ja: Record<string, string> = {};
    
    translations.forEach((t: any) => {
      zh_tw[t.key] = t.zh_tw;
      ja[t.key] = t.ja;
    });
    
    i18n.addResourceBundle('zh-TW', 'translation', zh_tw, true, true);
    i18n.addResourceBundle('ja', 'translation', ja, true, true);
  } catch (error) {
    console.error("Failed to load translations:", error);
  }
};

export default i18n;
