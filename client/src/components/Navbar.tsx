import { useState, useEffect, useCallback, memo } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Music } from "lucide-react";
import { useLang } from "@/contexts/LangContext";
import { t } from "@/lib/i18n";

// ─────────────────────────────────────────────────────────────────────────────
// Types & Constants
// ─────────────────────────────────────────────────────────────────────────────

interface NavLink {
  href: string;
  label: string;
  isAnchor?: boolean;
}

const SCROLL_THRESHOLD = 20;

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

interface LogoProps {
  className?: string;
}

const Logo = memo(function Logo({ className = "" }: LogoProps) {
  return (
    <Link href="/" className={`flex items-center gap-2 group ${className}`}>
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
  );
});

interface NavItemProps {
  href: string;
  label: string;
  isActive: boolean;
  isAnchor?: boolean;
  onClick?: () => void;
}

const NavItem = memo(function NavItem({
  href,
  label,
  isActive,
  isAnchor,
  onClick
}: NavItemProps) {
  const baseClasses = "px-4 py-2 text-sm font-['Be_Vietnam_Pro'] font-medium tracking-wide transition-colors rounded-md";
  const activeClasses = isActive
    ? "text-[var(--gold)]"
    : "text-white/80 hover:text-[var(--gold)]";

  if (isAnchor) {
    return (
      <a
        href={href}
        onClick={onClick}
        className={`${baseClasses} ${activeClasses}`}
      >
        {label}
      </a>
    );
  }

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`${baseClasses} ${activeClasses}`}
    >
      {label}
    </Link>
  );
});

interface MobileNavItemProps extends NavItemProps {
  onClick: () => void;
}

const MobileNavItem = memo(function MobileNavItem({
  href,
  label,
  isActive,
  isAnchor,
  onClick
}: MobileNavItemProps) {
  const baseClasses = "block px-4 py-3 font-['Be_Vietnam_Pro'] text-sm transition-colors rounded-lg hover:bg-white/5";
  const activeClasses = isActive ? "text-[var(--gold)]" : "text-white/80 hover:text-[var(--gold)]";

  if (isAnchor) {
    return (
      <a
        href={href}
        onClick={onClick}
        className={`${baseClasses} ${activeClasses}`}
      >
        {label}
      </a>
    );
  }

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`${baseClasses} ${activeClasses}`}
    >
      {label}
    </Link>
  );
});

interface LanguageToggleProps {
  lang: "vi" | "en";
  onToggle: () => void;
  compact?: boolean;
}

const LanguageToggle = memo(function LanguageToggle({
  lang,
  onToggle,
  compact = false
}: LanguageToggleProps) {
  if (compact) {
    return (
      <button
        onClick={onToggle}
        className="text-white/70 hover:text-[var(--gold)] text-xs font-['Be_Vietnam_Pro'] px-2 py-1 border border-white/20 rounded-full transition-colors"
        aria-label="Toggle language"
      >
        {lang === "vi" ? "VI" : "EN"}
      </button>
    );
  }

  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-white/20 text-white/70 hover:text-[var(--gold)] hover:border-[var(--gold)] transition-all text-xs font-['Be_Vietnam_Pro'] font-medium tracking-wider"
      aria-label="Toggle language"
    >
      <span className={lang === "vi" ? "text-[var(--gold)]" : "text-white/50"}>VI</span>
      <span className="text-white/30">|</span>
      <span className={lang === "en" ? "text-[var(--gold)]" : "text-white/50"}>EN</span>
    </button>
  );
});

interface MobileMenuButtonProps {
  isOpen: boolean;
  onToggle: () => void;
}

const MobileMenuButton = memo(function MobileMenuButton({
  isOpen,
  onToggle
}: MobileMenuButtonProps) {
  return (
    <button
      onClick={onToggle}
      className="text-white p-2 hover:text-[var(--gold)] transition-colors"
      aria-label={isOpen ? "Close menu" : "Open menu"}
      aria-expanded={isOpen}
    >
      {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
    </button>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Main Navbar Component
// ─────────────────────────────────────────────────────────────────────────────

export default function Navbar() {
  const { lang, toggle } = useLang();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [location] = useLocation();

  // Scroll handler with performance optimization
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > SCROLL_THRESHOLD;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [scrolled]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  const closeMobileMenu = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleMobileMenu = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  // Navigation links configuration
  const navLinks: NavLink[] = [
    { href: "/", label: t(lang, "nav_home") },
    { href: "/#about", label: t(lang, "nav_about"), isAnchor: true },
    { href: "/#gallery", label: t(lang, "nav_gallery"), isAnchor: true },
    { href: "/#booking", label: t(lang, "nav_booking"), isAnchor: true },
    { href: "/#events", label: t(lang, "nav_events"), isAnchor: true },
  ];

  const navClasses = `
    fixed top-0 left-0 right-0 z-50 transition-all duration-500
    ${scrolled
      ? "bg-[oklch(0.18_0.06_240)/95] backdrop-blur-md shadow-lg shadow-black/20"
      : "bg-transparent"
    }
  `;

  return (
    <nav className={navClasses}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Logo />

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <NavItem
                key={link.href}
                href={link.href}
                label={link.label}
                isActive={location === link.href}
                isAnchor={link.isAnchor}
              />
            ))}
            <Link
              href="/admin"
              className="px-4 py-2 text-sm font-['Be_Vietnam_Pro'] font-medium tracking-wide text-[var(--gold)] hover:text-white transition-colors rounded-md"
            >
              {t(lang, "nav_admin")}
            </Link>
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-3">
            <LanguageToggle lang={lang} onToggle={toggle} />
          </div>

          {/* Mobile Actions */}
          <div className="lg:hidden flex items-center gap-2">
            <LanguageToggle lang={lang} onToggle={toggle} compact />
            <MobileMenuButton isOpen={isOpen} onToggle={toggleMobileMenu} />
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="lg:hidden bg-[oklch(0.18_0.06_240)] border-t border-white/10">
          <div className="px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <MobileNavItem
                key={link.href}
                href={link.href}
                label={link.label}
                isActive={location === link.href}
                isAnchor={link.isAnchor}
                onClick={closeMobileMenu}
              />
            ))}
            <Link
              href="/admin"
              onClick={closeMobileMenu}
              className="block px-4 py-3 text-[var(--gold)] font-['Be_Vietnam_Pro'] text-sm transition-colors rounded-lg hover:bg-white/5"
            >
              {t(lang, "nav_admin")}
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
