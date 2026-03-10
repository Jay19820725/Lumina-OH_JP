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
  const [fontSettings, setFontSettings] = useState<any>(null);

  useEffect(() => {
    // 1. Check localStorage
    const savedLang = localStorage.getItem('user-language') as Language;
    if (savedLang && (savedLang === 'zh' || savedLang === 'ja')) {
      setLanguageState(savedLang);
    } else {
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
    }

    // Fetch font settings
    fetch('/api/settings/fonts')
      .then(res => res.json())
      .then(data => {
        setFontSettings(data);
      })
      .catch(err => console.error('Failed to fetch font settings:', err));
  }, []);

  useEffect(() => {
    if (!fontSettings || !fontSettings[language]) return;

    const currentFonts = fontSettings[language];
    
    // 1. Update CSS Variables
    document.documentElement.style.setProperty('--font-display', currentFonts.display.family);
    document.documentElement.style.setProperty('--font-body', currentFonts.body.family);

    // 2. Inject Font Links if not already present
    const injectFont = (url: string, id: string) => {
      if (!url) return;
      let link = document.getElementById(id) as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.id = id;
        link.rel = 'stylesheet';
        document.head.appendChild(link);
      }
      if (link.href !== url) {
        link.href = url;
      }
    };

    injectFont(currentFonts.display.url, 'dynamic-font-display');
    injectFont(currentFonts.body.url, 'dynamic-font-body');
  }, [language, fontSettings]);

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
