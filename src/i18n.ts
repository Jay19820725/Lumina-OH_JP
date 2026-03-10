import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'zh-TW',
    supportedLngs: ['zh-TW', 'ja'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    resources: {
      'zh-TW': { translation: {} },
      ja: { translation: {} },
    },
  });

export const loadTranslations = async () => {
  try {
    const response = await fetch('/api/translations');
    if (response.ok) {
      const data = await response.json();
      Object.keys(data).forEach((lng) => {
        i18n.addResourceBundle(lng, 'translation', data[lng], true, true);
      });
    }
  } catch (error) {
    console.error('Failed to load translations:', error);
  }
};

export default i18n;
