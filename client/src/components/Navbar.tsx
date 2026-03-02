import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Music, Shield } from "lucide-react";
import { useLang } from "@/contexts/LangContext";
import { useSeason } from "@/contexts/SeasonContext";
import { t } from "@/lib/i18n";
import { trpc } from "@/lib/trpc";
import { SEASON_THEMES, type LiturgicalSeason } from "@/lib/liturgicalSeason";

const SEASON_ORDER: LiturgicalSeason[] = ["ordinary", "advent", "christmas", "lent", "easter"];

export default function Navbar() {
  const { lang, toggle } = useLang();
  const { theme, season, setOverride } = useSeason();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showSeasonPicker, setShowSeasonPicker] = useState(false);
  const [location] = useLocation();

  const { data: adminStatus } = trpc.admin.check.useQuery(undefined, {
    retry: false,
    staleTime: 60_000,
  });
  const isAdmin = adminStatus?.isAdmin ?? false;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "/", label: t(lang, "nav_home") },
    { href: "/#about", label: t(lang, "nav_about") },
    { href: "/#gallery", label: t(lang, "nav_gallery") },
    { href: "/#booking", label: t(lang, "nav_booking") },
    { href: "/#events", label: t(lang, "nav_events") },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "backdrop-blur-md shadow-lg shadow-black/30"
          : "bg-transparent"
      }`}
      style={scrolled ? { backgroundColor: "oklch(from var(--season-bg) l c h / 0.92)" } : {}}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center shadow-md group-hover:scale-110 transition-transform"
              style={{ backgroundColor: "var(--gold)" }}
            >
              <Music className="w-5 h-5" style={{ color: "var(--season-bg)" }} />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-white font-['Cormorant_Garamond'] font-semibold text-lg leading-none">
                Thánh Linh
              </span>
              <span className="text-xs font-['Be_Vietnam_Pro'] tracking-widest uppercase leading-none" style={{ color: "var(--gold)" }}>
                Choir
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-4 py-2 text-sm font-['Be_Vietnam_Pro'] font-medium tracking-wide transition-colors rounded-md"
                style={{
                  color: location === link.href ? "var(--gold)" : "rgba(255,255,255,0.8)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--gold)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = location === link.href ? "var(--gold)" : "rgba(255,255,255,0.8)")}
              >
                {link.label}
              </a>
            ))}
            {isAdmin && (
              <Link
                href="/admin"
                className="px-4 py-2 text-sm font-['Be_Vietnam_Pro'] font-medium tracking-wide transition-colors rounded-md flex items-center gap-1"
                style={{ color: "var(--gold)" }}
              >
                <Shield className="w-3.5 h-3.5" />
                {t(lang, "nav_admin")}
              </Link>
            )}
          </div>

          {/* Right Actions */}
          <div className="hidden lg:flex items-center gap-3">

            {/* Season badge — click to cycle seasons (for preview/demo) */}
            <div className="relative">
              <button
                onClick={() => setShowSeasonPicker(!showSeasonPicker)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-['Be_Vietnam_Pro'] font-medium transition-all hover:scale-105 ${theme.badgeClass}`}
                title={lang === "vi" ? "Nhấn để xem mùa khác" : "Click to preview seasons"}
              >
                <span>{theme.icon}</span>
                <span>{lang === "vi" ? theme.nameVi : theme.nameEn}</span>
              </button>

              {/* Season picker dropdown */}
              {showSeasonPicker && (
                <div
                  className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-white/10 shadow-2xl overflow-hidden z-50"
                  style={{ backgroundColor: "var(--season-surface)" }}
                >
                  <div className="px-3 py-2 border-b border-white/10">
                    <p className="text-xs text-white/50 font-['Be_Vietnam_Pro']">
                      {lang === "vi" ? "Xem trước màu mùa" : "Preview season theme"}
                    </p>
                  </div>
                  {SEASON_ORDER.map((s) => {
                    const st = SEASON_THEMES[s];
                    return (
                      <button
                        key={s}
                        onClick={() => {
                          setOverride(s === season ? null : s);
                          setShowSeasonPicker(false);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm font-['Be_Vietnam_Pro'] transition-colors hover:bg-white/10 ${
                          s === season ? "text-white font-semibold" : "text-white/70"
                        }`}
                      >
                        <span className="text-base">{st.icon}</span>
                        <div>
                          <div>{st.nameVi}</div>
                          <div className="text-[10px] text-white/40">{st.nameEn}</div>
                        </div>
                        {s === season && (
                          <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 text-white/80">
                            {lang === "vi" ? "Hiện tại" : "Active"}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Language toggle */}
            <button
              onClick={toggle}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-white/20 text-white/70 hover:border-[var(--gold)] transition-all text-xs font-['Be_Vietnam_Pro'] font-medium tracking-wider"
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--gold)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
            >
              <span className={lang === "vi" ? "font-bold" : "opacity-50"} style={lang === "vi" ? { color: "var(--gold)" } : {}}>VI</span>
              <span className="text-white/30">|</span>
              <span className={lang === "en" ? "font-bold" : "opacity-50"} style={lang === "en" ? { color: "var(--gold)" } : {}}>EN</span>
            </button>

            {/* Admin link (subtle) */}
            {!isAdmin && (
              <Link
                href="/admin"
                className="flex items-center gap-1 px-3 py-1.5 text-white/30 hover:text-white/60 transition-colors text-xs font-['Be_Vietnam_Pro']"
                title={lang === "vi" ? "Quản trị" : "Admin"}
              >
                <Shield className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          {/* Mobile */}
          <div className="lg:hidden flex items-center gap-2">
            <button
              onClick={toggle}
              className="text-white/70 text-xs font-['Be_Vietnam_Pro'] px-2 py-1 border border-white/20 rounded-full"
            >
              {lang === "vi" ? "VI" : "EN"}
            </button>
            <span className="text-base">{theme.icon}</span>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-white p-2 transition-colors"
              style={{ color: isOpen ? "var(--gold)" : "white" }}
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div
          className="lg:hidden border-t border-white/10"
          style={{ backgroundColor: "var(--season-surface)" }}
        >
          <div className="px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="block px-4 py-3 text-white/80 font-['Be_Vietnam_Pro'] text-sm transition-colors rounded-lg hover:bg-white/5"
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--gold)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")}
              >
                {link.label}
              </a>
            ))}
            {/* Season info on mobile */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-['Be_Vietnam_Pro'] ${theme.badgeClass}`}>
              <span>{theme.icon}</span>
              <span>{lang === "vi" ? theme.nameVi : theme.nameEn}</span>
            </div>
            <Link
              href="/admin"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-4 py-3 text-white/50 font-['Be_Vietnam_Pro'] text-sm transition-colors rounded-lg hover:bg-white/5"
            >
              <Shield className="w-4 h-4" />
              {t(lang, "nav_admin")}
            </Link>
          </div>
        </div>
      )}

      {/* Click-outside to close season picker */}
      {showSeasonPicker && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowSeasonPicker(false)}
        />
      )}
    </nav>
  );
}
