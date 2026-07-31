import React, { createContext, useContext, useState, useEffect } from 'react';
import { detectBrowserLanguage, getTranslation, TranslationKey, LANGUAGES, Language } from '@/lib/i18n';

type LanguageContextType = {
  lang: string;
  setLang: (lang: string) => void;
  t: (key: TranslationKey, vars?: Record<string, string>) => string;
  dir: 'ltr' | 'rtl';
  currentLanguage: Language;
  languages: Language[];
};

const LanguageContext = createContext<LanguageContextType | null>(null);

const STORAGE_KEY = 'webmail_lang';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || detectBrowserLanguage();
    } catch {
      return 'en';
    }
  });

  const currentLanguage = LANGUAGES.find(l => l.code === lang) || LANGUAGES.find(l => l.code === 'en')!;
  const dir = currentLanguage.dir || 'ltr';

  const setLang = (newLang: string) => {
    setLangState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  const t = (key: TranslationKey, vars?: Record<string, string>) => {
    return getTranslation(lang, key, vars);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, dir, currentLanguage, languages: LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
