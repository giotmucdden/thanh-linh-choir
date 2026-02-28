import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { Lang } from "@/lib/i18n";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface LangContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggle: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = "choir-lang";
const DEFAULT_LANG: Lang = "vi";

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

function getInitialLang(): Lang {
  // Try to get from localStorage
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "vi" || stored === "en") {
      return stored;
    }

    // Fallback to browser language detection
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith("vi")) {
      return "vi";
    }
    if (browserLang.startsWith("en")) {
      return "en";
    }
  }

  return DEFAULT_LANG;
}

function persistLang(lang: Lang): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, lang);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────

const LangContext = createContext<LangContextType>({
  lang: DEFAULT_LANG,
  setLang: () => {},
  toggle: () => {},
});

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

interface LangProviderProps {
  children: React.ReactNode;
  defaultLang?: Lang;
}

export function LangProvider({ children, defaultLang }: LangProviderProps) {
  const [lang, setLangState] = useState<Lang>(() => defaultLang ?? getInitialLang());

  // Update document lang attribute
  useEffect(() => {
    document.documentElement.lang = lang;
    persistLang(lang);
  }, [lang]);

  const setLang = useCallback((newLang: Lang) => {
    setLangState(newLang);
  }, []);

  const toggle = useCallback(() => {
    setLangState((current) => (current === "vi" ? "en" : "vi"));
  }, []);

  const contextValue: LangContextType = {
    lang,
    setLang,
    toggle,
  };

  return (
    <LangContext.Provider value={contextValue}>
      {children}
    </LangContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useLang(): LangContextType {
  const context = useContext(LangContext);

  if (!context) {
    throw new Error("useLang must be used within a LangProvider");
  }

  return context;
}

export default LangContext;
