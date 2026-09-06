"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { DEFAULT_LANG, t, type Lang } from "./i18n";

const STORAGE_KEY = "kotihinta-lang";

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANG);

  useEffect(() => {
    // Restoring a persisted preference after mount (client-only storage, and
    // the server always renders the default) — a one-time sync from an
    // external store, not a derived-state anti-pattern.
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "fi" || stored === "en" || stored === "sv") {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLangState(stored);
      }
    } catch {
      // localStorage unavailable — stick with the default.
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  function setLang(next: Lang) {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within a LanguageProvider");
  return ctx;
}

export function useDictionary() {
  const { lang } = useLanguage();
  return t(lang);
}
