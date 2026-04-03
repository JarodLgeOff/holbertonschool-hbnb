"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import {
  DEFAULT_LANGUAGE,
  LANGUAGE_COOKIE_NAME,
  LANGUAGE_STORAGE_KEY,
  normalizeLanguage,
  translations,
  type Language,
  type TranslationKey,
} from "./i18n-data";

type I18nContextValue = {
  language: Language;
  mounted: boolean;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey) => string;
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

function setLanguageCookie(language: Language) {
  document.cookie = `${LANGUAGE_COOKIE_NAME}=${language}; path=/; max-age=31536000; samesite=lax`;
}

export function I18nProvider({ children, initialLanguage = DEFAULT_LANGUAGE }: { children: ReactNode; initialLanguage?: Language }) {
  const [language, setLanguageState] = useState<Language>(initialLanguage);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const storedLanguage = normalizeLanguage(window.localStorage.getItem(LANGUAGE_STORAGE_KEY));
    if (storedLanguage !== initialLanguage) {
      setLanguageState(storedLanguage);
    } else {
      document.documentElement.lang = storedLanguage;
    }
  }, [initialLanguage]);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    setLanguageCookie(language);
    document.documentElement.lang = language;
  }, [language, mounted]);

  const t = useMemo(
    () => (key: TranslationKey) => translations[language][key] ?? translations.fr[key] ?? key,
    [language]
  );

  const value = useMemo(
    () => ({ language, mounted, setLanguage: setLanguageState, t }),
    [language, mounted, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }

  return context;
}
