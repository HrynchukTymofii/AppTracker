'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Supported languages
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
] as const;

export type LanguageCode = typeof SUPPORTED_LANGUAGES[number]['code'];

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Import all translations
import en from '@/i18n/en';
import de from '@/i18n/de';
import es from '@/i18n/es';
import fr from '@/i18n/fr';
import it from '@/i18n/it';
import pt from '@/i18n/pt';
import nl from '@/i18n/nl';
import pl from '@/i18n/pl';
import ar from '@/i18n/ar';
import hi from '@/i18n/hi';
import ja from '@/i18n/ja';
import ko from '@/i18n/ko';
import uk from '@/i18n/uk';
import zh from '@/i18n/zh';

const translations: Record<LanguageCode, typeof en> = {
  en, de, es, fr, it, pt, nl, pl, ar, hi, ja, ko, uk, zh
};

function detectBrowserLanguage(): LanguageCode {
  if (typeof window === 'undefined') return 'en';

  const browserLangs = navigator.languages || [navigator.language];

  for (const lang of browserLangs) {
    const code = lang.split('-')[0].toLowerCase();
    if (SUPPORTED_LANGUAGES.some(l => l.code === code)) {
      return code as LanguageCode;
    }
  }

  return 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Check localStorage first, then browser language
    const saved = localStorage.getItem('lockin-language') as LanguageCode | null;
    const detected = saved || detectBrowserLanguage();
    setLanguageState(detected);
    setMounted(true);
  }, []);

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    localStorage.setItem('lockin-language', lang);
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value: unknown = translations[language];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        // Fallback to English
        value = translations['en'];
        for (const fallbackKey of keys) {
          if (value && typeof value === 'object' && fallbackKey in value) {
            value = (value as Record<string, unknown>)[fallbackKey];
          } else {
            return key; // Return key if not found
          }
        }
        break;
      }
    }

    if (typeof value !== 'string') return key;

    // Replace parameters
    if (params) {
      return Object.entries(params).reduce(
        (str, [param, val]) => str.replace(new RegExp(`{{${param}}}`, 'g'), String(val)),
        value
      );
    }

    return value;
  };

  const isRTL = language === 'ar';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      <div style={{ visibility: mounted ? 'visible' : 'hidden' }} dir={isRTL ? 'rtl' : 'ltr'}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
