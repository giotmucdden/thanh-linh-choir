import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/contexts/LangContext";
import { t } from "@/lib/i18n";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";

export default function Navbar() {
  const { lang, toggle } = useLang();
  const { user, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [location] = useLocation();
  const logout = trpc.auth.logout.useMutation({ onSuccess: () => window.location.reload() });

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

  const isAdmin = user?.role === "admin";

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-[oklch(0.18_0.06_240)/95] backdrop-blur-md shadow-lg shadow-black/20"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-full bg-[var(--gold)] flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
              <Music className="w-5 h-5 text-[oklch(0.15_0.03_240)]" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-white font-['Cormorant_Garamond'] font-semibold text-lg leading-none">
                Thánh Linh
              </span>
              <span className="text-[var(--gold)] text-xs font-['Be_Vietnam_Pro'] tracking-widest uppercase leading-none">
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
                className={`px-4 py-2 text-sm font-['Be_Vietnam_Pro'] font-medium tracking-wide transition-colors rounded-md ${
                  location === link.href
                    ? "text-[var(--gold)]"
                    : "text-white/80 hover:text-[var(--gold)]"
                }`}
              >
                {link.label}
              </a>
            ))}
            {isAdmin && (
              <Link
                href="/admin"
                className="px-4 py-2 text-sm font-['Be_Vietnam_Pro'] font-medium tracking-wide text-[var(--gold)] hover:text-white transition-colors rounded-md"
              >
                {t(lang, "nav_admin")}
              </Link>
            )}
          </div>

          {/* Right Actions */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Language toggle */}
            <button
              onClick={toggle}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-white/20 text-white/70 hover:text-[var(--gold)] hover:border-[var(--gold)] transition-all text-xs font-['Be_Vietnam_Pro'] font-medium tracking-wider"
            >
              <span className={lang === "vi" ? "text-[var(--gold)]" : "text-white/50"}>VI</span>
              <span className="text-white/30">|</span>
              <span className={lang === "en" ? "text-[var(--gold)]" : "text-white/50"}>EN</span>
            </button>

            {isAuthenticated ? (
              <Button
                size="sm"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 hover:text-white font-['Be_Vietnam_Pro'] text-xs"
                onClick={() => logout.mutate()}
              >
                {t(lang, "nav_logout")}
              </Button>
            ) : (
              <Button
                size="sm"
                className="bg-[var(--gold)] text-[oklch(0.15_0.03_240)] hover:bg-[var(--gold-light)] font-['Be_Vietnam_Pro'] font-semibold text-xs tracking-wide"
                onClick={() => (window.location.href = getLoginUrl())}
              >
                {t(lang, "nav_login")}
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center gap-2">
            <button
              onClick={toggle}
              className="text-white/70 hover:text-[var(--gold)] text-xs font-['Be_Vietnam_Pro'] px-2 py-1 border border-white/20 rounded-full"
            >
              {lang === "vi" ? "VI" : "EN"}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-white p-2 hover:text-[var(--gold)] transition-colors"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="lg:hidden bg-[oklch(0.18_0.06_240)] border-t border-white/10">
          <div className="px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="block px-4 py-3 text-white/80 hover:text-[var(--gold)] font-['Be_Vietnam_Pro'] text-sm transition-colors rounded-lg hover:bg-white/5"
              >
                {link.label}
              </a>
            ))}
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setIsOpen(false)}
                className="block px-4 py-3 text-[var(--gold)] font-['Be_Vietnam_Pro'] text-sm transition-colors rounded-lg hover:bg-white/5"
              >
                {t(lang, "nav_admin")}
              </Link>
            )}
            <div className="pt-3 border-t border-white/10">
              {isAuthenticated ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full border-white/30 text-white hover:bg-white/10"
                  onClick={() => logout.mutate()}
                >
                  {t(lang, "nav_logout")}
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="w-full bg-[var(--gold)] text-[oklch(0.15_0.03_240)] hover:bg-[var(--gold-light)] font-semibold"
                  onClick={() => (window.location.href = getLoginUrl())}
                >
                  {t(lang, "nav_login")}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
