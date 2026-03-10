import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, Language, TranslationKey } from './translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('zh');

  useEffect(() => {
    // 1. Check localStorage
    const savedLang = localStorage.getItem('user-language') as Language;
    if (savedLang && (savedLang === 'zh' || savedLang === 'ja')) {
      setLanguageState(savedLang);
      return;
    }

    // 2. Auto-detect from system
    const systemLang = navigator.language.toLowerCase();
    if (systemLang.startsWith('ja')) {
      setLanguageState('ja');
    } else if (systemLang.startsWith('zh')) {
      setLanguageState('zh');
    } else {
      // 3. Default to Chinese if not Chinese or Japanese
      setLanguageState('zh');
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('user-language', lang);
  };

  const t = (key: TranslationKey): string => {
    return translations[language][key] || translations['zh'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
