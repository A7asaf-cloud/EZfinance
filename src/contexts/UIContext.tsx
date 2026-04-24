import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../translations';

type Theme = 'light' | 'dark';
type Language = 'en' | 'he';
type Dir = 'ltr' | 'rtl';

interface UIContextType {
  theme: Theme;
  language: Language;
  dir: Dir;
  toggleTheme: () => void;
  setLanguage: (lang: Language) => void;
  t: (key: any) => string;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => 
    (localStorage.getItem('theme') as Theme) || 'light'
  );
  const [language, setLanguageState] = useState<Language>(() => 
    (localStorage.getItem('language') as Language) || 'en'
  );
  
  const dir: Dir = language === 'he' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
    localStorage.setItem('theme', theme);
    localStorage.setItem('language', language);
    localStorage.setItem('dir', dir);
  }, [theme, language, dir]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  const setLanguage = (lang: Language) => setLanguageState(lang);

  const t = (key: keyof typeof translations.en) => {
    return translations[language][key] || translations.en[key] || key;
  };

  return (
    <UIContext.Provider value={{ theme, language, dir, toggleTheme, setLanguage, t }}>
      {children}
    </UIContext.Provider>
  );
}

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) throw new Error('useUI must be used within UIProvider');
  return context;
};
