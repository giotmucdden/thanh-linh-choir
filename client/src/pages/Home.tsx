import { useEffect, useState, memo, useCallback } from "react";
import { ChevronDown, Music, Users, Calendar, Star, Phone, Mail, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/contexts/LangContext";
import { t } from "@/lib/i18n";
import { useInView } from "@/hooks/useInView";
import PhotoGallery from "@/components/PhotoGallery";
import BookingCalendar from "@/components/BookingCalendar";
import DmlvEvents from "@/components/DmlvEvents";

// ─────────────────────────────────────────────────────────────────────────────
// Reusable Components
// ─────────────────────────────────────────────────────────────────────────────

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
}

const AnimatedSection = memo(function AnimatedSection({
  children,
  className = ""
}: AnimatedSectionProps) {
  const { ref, inView } = useInView();

  return (
    <div
      ref={ref}
      className={`
        transition-all duration-700
        ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
        ${className}
      `}
    >
      {children}
    </div>
  );
});

interface SectionHeaderProps {
  subtitle: string;
  title: string;
  light?: boolean;
}

const SectionHeader = memo(function SectionHeader({
  subtitle,
  title,
  light = false
}: SectionHeaderProps) {
  return (
    <AnimatedSection className="text-center mb-12 lg:mb-16">
      <p className="text-[var(--gold)] font-['Be_Vietnam_Pro'] text-sm tracking-[0.3em] uppercase mb-3">
        {subtitle}
      </p>
      <h2 className={`font-['Cormorant_Garamond'] text-4xl md:text-5xl font-light ${
        light ? "text-white" : "text-foreground"
      }`}>
        {title}
      </h2>
      <div className="mt-4 mx-auto w-24 h-0.5 bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent" />
    </AnimatedSection>
  );
});

interface StatCardProps {
  icon: React.ElementType;
  value: string;
  label: string;
}

const StatCard = memo(function StatCard({ icon: Icon, value, label }: StatCardProps) {
  return (
    <div className="text-center p-4 rounded-xl bg-card border border-border hover:border-[var(--gold)/50] transition-colors">
      <Icon className="w-6 h-6 text-[var(--gold)] mx-auto mb-2" />
      <div className="font-['Cormorant_Garamond'] text-2xl font-semibold text-foreground">
        {value}
      </div>
      <div className="font-['Be_Vietnam_Pro'] text-xs text-muted-foreground mt-1">
        {label}
      </div>
    </div>
  );
});

interface ServiceItemProps {
  text: string;
}

const ServiceItem = memo(function ServiceItem({ text }: ServiceItemProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-1.5 h-1.5 rounded-full bg-[var(--gold)] flex-shrink-0" />
      <span className="font-['Be_Vietnam_Pro'] text-sm text-foreground">{text}</span>
    </div>
  );
});

interface FooterLinkProps {
  href: string;
  label: string;
}

const FooterLink = memo(function FooterLink({ href, label }: FooterLinkProps) {
  return (
    <a
      href={href}
      className="block text-white/60 hover:text-[var(--gold)] font-['Be_Vietnam_Pro'] text-sm transition-colors"
    >
      {label}
    </a>
  );
});

interface ContactItemProps {
  icon: React.ElementType;
  children: React.ReactNode;
}

const ContactItem = memo(function ContactItem({ icon: Icon, children }: ContactItemProps) {
  return (
    <div className="flex items-center gap-2 text-white/60 font-['Be_Vietnam_Pro'] text-sm">
      <Icon className="w-4 h-4 text-[var(--gold)]" />
      <span>{children}</span>
    </div>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Section Components
// ─────────────────────────────────────────────────────────────────────────────

const HeroSection = memo(function HeroSection() {
  const { lang } = useLang();
  const [heroLoaded, setHeroLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setHeroLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const scrollToSection = useCallback((sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const heroClasses = {
    icon: `mb-6 transition-all duration-1000 ${heroLoaded ? "opacity-100 scale-100" : "opacity-0 scale-75"}`,
    subtitle: `text-[var(--gold)] font-['Be_Vietnam_Pro'] text-sm tracking-[0.4em] uppercase mb-4 transition-all duration-700 delay-200 ${heroLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`,
    title: `font-['Cormorant_Garamond'] text-5xl md:text-7xl lg:text-8xl font-light text-white mb-6 leading-tight transition-all duration-700 delay-300 ${heroLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`,
    divider: `w-24 h-px bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent mx-auto mb-6 transition-all duration-700 delay-400 ${heroLoaded ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"}`,
    description: `text-white/70 font-['Be_Vietnam_Pro'] text-base md:text-lg max-w-2xl mx-auto mb-10 leading-relaxed transition-all duration-700 delay-500 ${heroLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`,
    buttons: `flex flex-col sm:flex-row gap-4 justify-center transition-all duration-700 delay-600 ${heroLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`,
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=1920&h=1080&fit=crop"
          alt="Choir background"
          className="w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[oklch(0.18_0.06_240)/80] via-[oklch(0.18_0.06_240)/70] to-[oklch(0.18_0.06_240)/90]" />
        {/* Subtle pattern overlay */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4af37' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Hero content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        {/* Decorative icon */}
        <div className={heroClasses.icon}>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border-2 border-[var(--gold)] bg-[var(--gold)/10] backdrop-blur-sm">
            <Music className="w-7 h-7 text-[var(--gold)]" />
          </div>
        </div>

        <p className={heroClasses.subtitle}>
          {t(lang, "hero_subtitle")}
        </p>

        <h1 className={heroClasses.title}>
          <span className="text-shimmer">{t(lang, "hero_title")}</span>
        </h1>

        <div className={heroClasses.divider} />

        <p className={heroClasses.description}>
          {t(lang, "hero_desc")}
        </p>

        <div className={heroClasses.buttons}>
          <Button
            size="lg"
            className="bg-[var(--gold)] text-[oklch(0.15_0.03_240)] hover:bg-[var(--gold-light)] font-['Be_Vietnam_Pro'] font-semibold tracking-wide px-8 shadow-lg shadow-[var(--gold)/30] hover:shadow-[var(--gold)/50] transition-all"
            onClick={() => scrollToSection("booking")}
          >
            {t(lang, "hero_cta_book")}
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-white/40 text-white bg-white/5 hover:bg-white/15 hover:border-white/60 font-['Be_Vietnam_Pro'] tracking-wide px-8 backdrop-blur-sm"
            onClick={() => scrollToSection("about")}
          >
            {t(lang, "hero_cta_learn")}
          </Button>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <ChevronDown className="w-6 h-6 text-[var(--gold)/60]" />
      </div>

      {/* Bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
});

const AboutSection = memo(function AboutSection() {
  const { lang } = useLang();

  const stats = [
    { icon: Users, value: "60+", label: t(lang, "about_stat_members") },
    { icon: Calendar, value: "100+", label: t(lang, "about_stat_events") },
    { icon: Star, value: "15+", label: t(lang, "about_stat_years") },
  ];

  const services = lang === "vi"
    ? [
        "Thánh lễ Chúa Nhật & Lễ trọng",
        "Lễ cưới & Lễ an táng",
        "Lễ Đức Mẹ La Vang hàng tháng",
        "Buổi hòa nhạc & Sự kiện đặc biệt",
      ]
    : [
        "Sunday & Feast Day Masses",
        "Weddings & Funerals",
        "Monthly DMLV Masses",
        "Concerts & Special Events",
      ];

  return (
    <section id="about" className="py-24 bg-background">
      <div className="max-w-6xl mx-auto px-4">
        <SectionHeader
          subtitle={t(lang, "about_subtitle")}
          title={t(lang, "about_title")}
        />

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Image */}
          <AnimatedSection>
            <div className="relative">
              <div className="absolute -inset-4 bg-[var(--gold)/5] rounded-2xl" />
              <img
                src="https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=600&h=450&fit=crop"
                alt="Choir"
                className="relative rounded-xl shadow-2xl w-full object-cover"
                loading="lazy"
              />
              <div className="absolute -bottom-4 -right-4 bg-[var(--gold)] text-[oklch(0.15_0.03_240)] rounded-xl px-6 py-4 shadow-xl">
                <div className="font-['Cormorant_Garamond'] text-3xl font-bold">15+</div>
                <div className="font-['Be_Vietnam_Pro'] text-xs font-semibold tracking-wider uppercase">
                  {t(lang, "about_stat_years")}
                </div>
              </div>
            </div>
          </AnimatedSection>

          {/* Content */}
          <AnimatedSection>
            <p className="font-['Be_Vietnam_Pro'] text-muted-foreground text-base leading-relaxed mb-8">
              {t(lang, "about_desc")}
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mb-8">
              {stats.map(({ icon, value, label }) => (
                <StatCard key={label} icon={icon} value={value} label={label} />
              ))}
            </div>

            {/* Services */}
            <div className="space-y-3">
              {services.map((service) => (
                <ServiceItem key={service} text={service} />
              ))}
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
});

const BookingSection = memo(function BookingSection() {
  const { lang } = useLang();

  return (
    <section id="booking" className="py-24 bg-background">
      <div className="max-w-6xl mx-auto px-4">
        <SectionHeader
          subtitle={t(lang, "booking_subtitle")}
          title={t(lang, "booking_title")}
        />
        <BookingCalendar />
      </div>
    </section>
  );
});

const EventsSection = memo(function EventsSection() {
  const { lang } = useLang();

  return (
    <section id="events" className="py-24 bg-[oklch(0.18_0.06_240)]">
      <div className="max-w-6xl mx-auto px-4">
        <SectionHeader
          subtitle={t(lang, "dmlv_subtitle")}
          title={t(lang, "dmlv_title")}
          light
        />
        <DmlvEvents />
      </div>
    </section>
  );
});

const Footer = memo(function Footer() {
  const { lang } = useLang();

  const quickLinks = [
    { href: "#about", label: t(lang, "nav_about") },
    { href: "#gallery", label: t(lang, "nav_gallery") },
    { href: "#booking", label: t(lang, "nav_booking") },
    { href: "#events", label: t(lang, "nav_events") },
  ];

  return (
    <footer className="bg-[oklch(0.12_0.04_240)] border-t border-white/10 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-[var(--gold)] flex items-center justify-center">
                <Music className="w-4 h-4 text-[oklch(0.15_0.03_240)]" />
              </div>
              <span className="font-['Cormorant_Garamond'] text-white text-xl font-semibold">
                Ca Đoàn Thánh Linh
              </span>
            </div>
            <p className="font-['Be_Vietnam_Pro'] text-white/50 text-sm leading-relaxed">
              {lang === "vi"
                ? "Phục vụ Thiên Chúa qua tiếng hát với tình yêu và lòng kính tôn."
                : "Serving God through song with love and reverence."}
            </p>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-['Cormorant_Garamond'] text-[var(--gold)] text-lg mb-4">
              {lang === "vi" ? "Liên Hệ" : "Contact"}
            </h4>
            <div className="space-y-2">
              <ContactItem icon={MapPin}>{t(lang, "dmlv_location")}</ContactItem>
              <ContactItem icon={Mail}>thanhlinh.choir@gmail.com</ContactItem>
              <ContactItem icon={Phone}>(+84) 123 456 789</ContactItem>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-['Cormorant_Garamond'] text-[var(--gold)] text-lg mb-4">
              {lang === "vi" ? "Nhanh Chóng" : "Quick Links"}
            </h4>
            <div className="space-y-2">
              {quickLinks.map((link) => (
                <FooterLink key={link.href} href={link.href} label={link.label} />
              ))}
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-white/10 pt-6 text-center">
          <p className="font-['Be_Vietnam_Pro'] text-white/30 text-xs">
            © {new Date().getFullYear()} Ca Đoàn Thánh Linh.{" "}
            {lang === "vi" ? "Mọi quyền được bảo lưu." : "All rights reserved."}
          </p>
        </div>
      </div>
    </footer>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Main Page Component
// ─────────────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <HeroSection />
      <AboutSection />
      <PhotoGallery />
      <BookingSection />
      <EventsSection />
      <Footer />
    </div>
  );
}
