import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  type SeasonTheme,
  getSeasonTheme,
  getCurrentSeason,
  type LiturgicalSeason,
} from "@/lib/liturgicalSeason";

interface SeasonContextValue {
  theme: SeasonTheme;
  season: LiturgicalSeason;
  /** Override for testing/preview — null = auto-detect */
  override: LiturgicalSeason | null;
  setOverride: (s: LiturgicalSeason | null) => void;
}

const SeasonContext = createContext<SeasonContextValue | null>(null);

export function SeasonProvider({ children }: { children: React.ReactNode }) {
  const [override, setOverride] = useState<LiturgicalSeason | null>(null);

  const season: LiturgicalSeason = override ?? getCurrentSeason();
  const theme = getSeasonTheme(override ? new Date(0) : undefined);
  // When override is set, compute theme from override key directly
  const effectiveTheme: SeasonTheme = useMemo(() => {
    if (override) {
      const { SEASON_THEMES } = require("@/lib/liturgicalSeason");
      return SEASON_THEMES[override] as SeasonTheme;
    }
    return theme;
  }, [override, theme]);

  // Inject CSS variables into :root whenever season changes
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-season", effectiveTheme.season);
    root.style.setProperty("--season-primary", effectiveTheme.primary);
    root.style.setProperty("--season-secondary", effectiveTheme.secondary);
    root.style.setProperty("--season-bg", effectiveTheme.background);
    root.style.setProperty("--season-surface", effectiveTheme.surface);
    root.style.setProperty("--season-hero-overlay", effectiveTheme.heroOverlay);
    // Also update the main gold/navy tokens so ALL components auto-update
    root.style.setProperty("--gold", effectiveTheme.primary);
    root.style.setProperty(
      "--gold-light",
      effectiveTheme.primary.replace(/oklch\(([0-9.]+)/, (_, l) =>
        `oklch(${Math.min(1, parseFloat(l) + 0.08).toFixed(2)}`
      )
    );
    root.style.setProperty("--background", effectiveTheme.background);
    root.style.setProperty("--sidebar-background", effectiveTheme.surface);
    root.style.setProperty("--card", effectiveTheme.surface);
  }, [effectiveTheme]);

  return (
    <SeasonContext.Provider
      value={{ theme: effectiveTheme, season: effectiveTheme.season, override, setOverride }}
    >
      {children}
    </SeasonContext.Provider>
  );
}

export function useSeason() {
  const ctx = useContext(SeasonContext);
  if (!ctx) throw new Error("useSeason must be used inside SeasonProvider");
  return ctx;
}
