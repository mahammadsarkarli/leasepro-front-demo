import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useTranslation } from '../i18n';

interface LanguageContextType {
  currentLanguage: string;
  changeLanguage: (language: string) => void;
  availableLanguages: { code: string; name: string; nativeName: string }[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language || 'az');

  const availableLanguages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'az', name: 'Azerbaijani', nativeName: 'Azərbaycanca' },
  ];

  const changeLanguage = (language: string) => {
    i18n.changeLanguage(language);
    setCurrentLanguage(language);
    localStorage.setItem('language', language);
  };

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage && availableLanguages.some(lang => lang.code === savedLanguage)) {
      changeLanguage(savedLanguage);
    } else {
      // Set default language to Azerbaijani if no saved language
      changeLanguage('az');
    }
  }, []);

  const value: LanguageContextType = {
    currentLanguage,
    changeLanguage,
    availableLanguages,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
