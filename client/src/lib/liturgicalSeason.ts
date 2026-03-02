/**
 * Liturgical Season Detection
 * Automatically determines the current Catholic liturgical season
 * and returns the corresponding theme data.
 *
 * Seasons:
 *  - Mùa Vọng (Advent): 4 Sundays before Christmas → ~Dec 1–24
 *  - Mùa Giáng Sinh (Christmas): Dec 25 → Baptism of the Lord (~Jan 12)
 *  - Mùa Chay (Lent): Ash Wednesday → Holy Saturday (~46 days before Easter)
 *  - Mùa Phục Sinh (Easter): Easter Sunday → Pentecost (~50 days)
 *  - Mùa Thường Niên (Ordinary Time): all other periods
 */

export type LiturgicalSeason =
  | "advent"
  | "christmas"
  | "lent"
  | "easter"
  | "ordinary";

export interface SeasonTheme {
  season: LiturgicalSeason;
  nameVi: string;
  nameEn: string;
  /** OKLCH primary color (gold/accent replacement) */
  primary: string;
  /** OKLCH secondary accent */
  secondary: string;
  /** OKLCH background base */
  background: string;
  /** OKLCH sidebar/navbar background */
  surface: string;
  /** Hero overlay gradient (CSS) */
  heroOverlay: string;
  /** Season icon emoji */
  icon: string;
  /** Tailwind-compatible CSS class for badge */
  badgeClass: string;
}

// ── Easter calculation (Anonymous Gregorian algorithm) ──────────────────────

function getEasterDate(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 1-based
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

// ── First Sunday of Advent ──────────────────────────────────────────────────

function getAdventStart(year: number): Date {
  // Advent starts on the Sunday 4 weeks before Christmas (nearest Sunday to Nov 30)
  const christmas = new Date(year, 11, 25);
  const dow = christmas.getDay(); // 0=Sun
  // Days back to the Sunday 4 Sundays before Christmas
  const daysBack = dow === 0 ? 28 : dow + 21;
  const advent = new Date(year, 11, 25 - daysBack);
  return advent;
}

// ── Main season detector ────────────────────────────────────────────────────

export function getCurrentSeason(date: Date = new Date()): LiturgicalSeason {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-based
  const day = date.getDate();

  const easter = getEasterDate(year);
  const easterMs = easter.getTime();
  const nowMs = new Date(year, month - 1, day).getTime();
  const DAY = 86400000;

  // Ash Wednesday = Easter - 46 days
  const ashWednesdayMs = easterMs - 46 * DAY;
  // Pentecost = Easter + 49 days
  const pentecostMs = easterMs + 49 * DAY;
  // Baptism of the Lord = Jan 12 (approx end of Christmas season)
  const baptismMs = new Date(year, 0, 13).getTime(); // Jan 13 (day after)

  // Advent for current year (starts in late Nov/early Dec)
  const adventStart = getAdventStart(year);
  const adventStartMs = adventStart.getTime();
  const christmasMs = new Date(year, 11, 25).getTime();

  // Also check previous year's Christmas season (Jan 1 – ~Jan 12)
  const prevBaptismMs = new Date(year, 0, 13).getTime();

  // Jan 1 – Jan 12: still Christmas season from previous year
  if (nowMs < prevBaptismMs) {
    return "christmas";
  }

  // Lent: Ash Wednesday → Holy Saturday (Easter - 1)
  if (nowMs >= ashWednesdayMs && nowMs < easterMs) {
    return "lent";
  }

  // Easter: Easter Sunday → Pentecost Sunday
  if (nowMs >= easterMs && nowMs <= pentecostMs) {
    return "easter";
  }

  // Advent: First Sunday of Advent → Dec 24
  if (nowMs >= adventStartMs && nowMs < christmasMs) {
    return "advent";
  }

  // Christmas: Dec 25 → Jan 12 (next year handled above)
  if (nowMs >= christmasMs) {
    return "christmas";
  }

  return "ordinary";
}

// ── Season themes ───────────────────────────────────────────────────────────

export const SEASON_THEMES: Record<LiturgicalSeason, SeasonTheme> = {
  advent: {
    season: "advent",
    nameVi: "Mùa Vọng",
    nameEn: "Advent",
    // Deep purple/violet palette
    primary: "oklch(0.72 0.18 290)",        // Soft violet-gold
    secondary: "oklch(0.55 0.22 280)",       // Deep purple
    background: "oklch(0.10 0.04 270)",      // Very dark navy-purple
    surface: "oklch(0.13 0.05 270)",
    heroOverlay:
      "linear-gradient(to bottom, oklch(0.10 0.06 280 / 0.75) 0%, oklch(0.08 0.04 270 / 0.85) 100%)",
    icon: "🕯️",
    badgeClass: "bg-purple-900/80 text-purple-200 border-purple-700",
  },
  christmas: {
    season: "christmas",
    nameVi: "Mùa Giáng Sinh",
    nameEn: "Christmas",
    // Rich red and gold
    primary: "oklch(0.82 0.18 55)",          // Warm gold
    secondary: "oklch(0.50 0.22 25)",        // Deep crimson
    background: "oklch(0.10 0.04 25)",       // Very dark warm dark
    surface: "oklch(0.13 0.05 20)",
    heroOverlay:
      "linear-gradient(to bottom, oklch(0.12 0.08 25 / 0.72) 0%, oklch(0.08 0.05 20 / 0.88) 100%)",
    icon: "✨",
    badgeClass: "bg-red-900/80 text-yellow-200 border-red-700",
  },
  lent: {
    season: "lent",
    nameVi: "Mùa Chay",
    nameEn: "Lent",
    // Muted purple-grey, austere
    primary: "oklch(0.65 0.10 290)",         // Muted lavender
    secondary: "oklch(0.40 0.08 280)",       // Dark grey-purple
    background: "oklch(0.09 0.02 270)",      // Near-black with purple tint
    surface: "oklch(0.12 0.03 270)",
    heroOverlay:
      "linear-gradient(to bottom, oklch(0.10 0.04 280 / 0.80) 0%, oklch(0.07 0.02 270 / 0.90) 100%)",
    icon: "🌿",
    badgeClass: "bg-slate-800/80 text-purple-300 border-slate-600",
  },
  easter: {
    season: "easter",
    nameVi: "Mùa Phục Sinh",
    nameEn: "Easter",
    // Bright white-gold, joyful
    primary: "oklch(0.88 0.20 85)",          // Bright gold-yellow
    secondary: "oklch(0.75 0.15 100)",       // Spring green-gold
    background: "oklch(0.10 0.02 90)",       // Dark with warm tint
    surface: "oklch(0.13 0.03 90)",
    heroOverlay:
      "linear-gradient(to bottom, oklch(0.12 0.06 85 / 0.65) 0%, oklch(0.08 0.03 90 / 0.80) 100%)",
    icon: "☀️",
    badgeClass: "bg-yellow-900/80 text-yellow-100 border-yellow-600",
  },
  ordinary: {
    season: "ordinary",
    nameVi: "Mùa Thường Niên",
    nameEn: "Ordinary Time",
    // Classic deep navy + gold (original theme)
    primary: "oklch(0.78 0.16 75)",          // Original gold
    secondary: "oklch(0.45 0.12 240)",       // Deep navy
    background: "oklch(0.10 0.03 240)",      // Dark navy
    surface: "oklch(0.13 0.04 240)",
    heroOverlay:
      "linear-gradient(to bottom, oklch(0.10 0.05 240 / 0.70) 0%, oklch(0.07 0.03 240 / 0.85) 100%)",
    icon: "🎵",
    badgeClass: "bg-blue-900/80 text-yellow-200 border-blue-700",
  },
};

export function getSeasonTheme(date: Date = new Date()): SeasonTheme {
  return SEASON_THEMES[getCurrentSeason(date)];
}
