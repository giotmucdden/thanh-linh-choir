import React, { createContext, useContext, useState } from "react";
import type { Lang } from "@/lib/i18n";

interface LangContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggle: () => void;
}

const LangContext = createContext<LangContextType>({
  lang: "vi",
  setLang: () => {},
  toggle: () => {},
});

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("vi");
  const toggle = () => setLang((l) => (l === "vi" ? "en" : "vi"));
  return <LangContext.Provider value={{ lang, setLang, toggle }}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}
