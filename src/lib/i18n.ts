import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Initial resources (empty, will be populated from API)
const resources = {
  'zh-TW': {
    translation: {}
  },
  'ja': {
    translation: {}
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
    },
  });

export const loadTranslations = async () => {
  try {
    const response = await fetch('/api/translations');
    if (response.ok) {
      const data = await response.json();
      Object.keys(data).forEach(lang => {
        i18n.addResourceBundle(lang, 'translation', data[lang], true, true);
      });
    }
  } catch (error) {
    console.error('Failed to load translations:', error);
  }
};

export default i18n;
