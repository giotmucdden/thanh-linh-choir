import { useEffect, useRef, useState } from "react";
import { ChevronDown, Music, Users, Calendar, Star, Phone, Mail, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/contexts/LangContext";
import { t } from "@/lib/i18n";
import PhotoGallery from "@/components/PhotoGallery";
import BookingCalendar from "@/components/BookingCalendar";
import DmlvEvents from "@/components/DmlvEvents";

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function AnimatedSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { ref, inView } = useInView();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}
    >
      {children}
    </div>
  );
}

export default function Home() {
  const { lang } = useLang();
  const [heroLoaded, setHeroLoaded] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setHeroLoaded(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero Section ─────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=1920&h=1080&fit=crop"
            alt="Choir background"
            className="w-full h-full object-cover"
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
          {/* Decorative cross/music note */}
          <div
            className={`mb-6 transition-all duration-1000 ${heroLoaded ? "opacity-100 scale-100" : "opacity-0 scale-75"}`}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border-2 border-[var(--gold)] bg-[var(--gold)/10] backdrop-blur-sm">
              <Music className="w-7 h-7 text-[var(--gold)]" />
            </div>
          </div>

          <p
            className={`text-[var(--gold)] font-['Be_Vietnam_Pro'] text-sm tracking-[0.4em] uppercase mb-4 transition-all duration-700 delay-200 ${heroLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            {t(lang, "hero_subtitle")}
          </p>

          <h1
            className={`font-['Cormorant_Garamond'] text-5xl md:text-7xl lg:text-8xl font-light text-white mb-6 leading-tight transition-all duration-700 delay-300 ${heroLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <span className="text-shimmer">{t(lang, "hero_title")}</span>
          </h1>

          <div
            className={`w-24 h-px bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent mx-auto mb-6 transition-all duration-700 delay-400 ${heroLoaded ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"}`}
          />

          <p
            className={`text-white/70 font-['Be_Vietnam_Pro'] text-base md:text-lg max-w-2xl mx-auto mb-10 leading-relaxed transition-all duration-700 delay-500 ${heroLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            {t(lang, "hero_desc")}
          </p>

          <div
            className={`flex flex-col sm:flex-row gap-4 justify-center transition-all duration-700 delay-600 ${heroLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <Button
              size="lg"
              className="bg-[var(--gold)] text-[oklch(0.15_0.03_240)] hover:bg-[var(--gold-light)] font-['Be_Vietnam_Pro'] font-semibold tracking-wide px-8 shadow-lg shadow-[var(--gold)/30] hover:shadow-[var(--gold)/50] transition-all"
              onClick={() => document.getElementById("booking")?.scrollIntoView({ behavior: "smooth" })}
            >
              {t(lang, "hero_cta_book")}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/40 text-white bg-white/5 hover:bg-white/15 hover:border-white/60 font-['Be_Vietnam_Pro'] tracking-wide px-8 backdrop-blur-sm"
              onClick={() => document.getElementById("about")?.scrollIntoView({ behavior: "smooth" })}
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

      {/* ── About Section ─────────────────────────────────────────── */}
      <section id="about" className="py-24 bg-background">
        <div className="max-w-6xl mx-auto px-4">
          <AnimatedSection className="text-center mb-16">
            <p className="text-[var(--gold)] font-['Be_Vietnam_Pro'] text-sm tracking-[0.3em] uppercase mb-3">
              {t(lang, "about_subtitle")}
            </p>
            <h2 className="font-['Cormorant_Garamond'] text-4xl md:text-5xl font-light text-foreground">
              {t(lang, "about_title")}
            </h2>
            <div className="mt-4 mx-auto w-24 h-0.5 bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent" />
          </AnimatedSection>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <AnimatedSection>
              <div className="relative">
                <div className="absolute -inset-4 bg-[var(--gold)/5] rounded-2xl" />
                <img
                  src="https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=600&h=450&fit=crop"
                  alt="Choir"
                  className="relative rounded-xl shadow-2xl w-full object-cover"
                />
                <div className="absolute -bottom-4 -right-4 bg-[var(--gold)] text-[oklch(0.15_0.03_240)] rounded-xl px-6 py-4 shadow-xl">
                  <div className="font-['Cormorant_Garamond'] text-3xl font-bold">15+</div>
                  <div className="font-['Be_Vietnam_Pro'] text-xs font-semibold tracking-wider uppercase">
                    {t(lang, "about_stat_years")}
                  </div>
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection>
              <p className="font-['Be_Vietnam_Pro'] text-muted-foreground text-base leading-relaxed mb-8">
                {t(lang, "about_desc")}
              </p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 mb-8">
                {[
                  { icon: Users, value: "60+", label: t(lang, "about_stat_members") },
                  { icon: Calendar, value: "100+", label: t(lang, "about_stat_events") },
                  { icon: Star, value: "15+", label: t(lang, "about_stat_years") },
                ].map(({ icon: Icon, value, label }) => (
                  <div key={label} className="text-center p-4 rounded-xl bg-card border border-border hover:border-[var(--gold)/50] transition-colors">
                    <Icon className="w-6 h-6 text-[var(--gold)] mx-auto mb-2" />
                    <div className="font-['Cormorant_Garamond'] text-2xl font-semibold text-foreground">{value}</div>
                    <div className="font-['Be_Vietnam_Pro'] text-xs text-muted-foreground mt-1">{label}</div>
                  </div>
                ))}
              </div>

              {/* Services */}
              <div className="space-y-3">
                {[
                  lang === "vi" ? "Thánh lễ Chúa Nhật & Lễ trọng" : "Sunday & Feast Day Masses",
                  lang === "vi" ? "Lễ cưới & Lễ an táng" : "Weddings & Funerals",
                  lang === "vi" ? "Lễ Đức Mẹ La Vang hàng tháng" : "Monthly DMLV Masses",
                  lang === "vi" ? "Buổi hòa nhạc & Sự kiện đặc biệt" : "Concerts & Special Events",
                ].map((service) => (
                  <div key={service} className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--gold)] flex-shrink-0" />
                    <span className="font-['Be_Vietnam_Pro'] text-sm text-foreground">{service}</span>
                  </div>
                ))}
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ── Gallery Section ────────────────────────────────────────── */}
      <PhotoGallery />

      {/* ── Booking Section ────────────────────────────────────────── */}
      <section id="booking" className="py-24 bg-background">
        <div className="max-w-6xl mx-auto px-4">
          <AnimatedSection className="text-center mb-12">
            <p className="text-[var(--gold)] font-['Be_Vietnam_Pro'] text-sm tracking-[0.3em] uppercase mb-3">
              {t(lang, "booking_subtitle")}
            </p>
            <h2 className="font-['Cormorant_Garamond'] text-4xl md:text-5xl font-light text-foreground">
              {t(lang, "booking_title")}
            </h2>
            <div className="mt-4 mx-auto w-24 h-0.5 bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent" />
          </AnimatedSection>
          <BookingCalendar />
        </div>
      </section>

      {/* ── DMLV Events Section ────────────────────────────────────── */}
      <section id="events" className="py-24 bg-[oklch(0.18_0.06_240)]">
        <div className="max-w-6xl mx-auto px-4">
          <AnimatedSection className="text-center mb-12">
            <p className="text-[var(--gold)] font-['Be_Vietnam_Pro'] text-sm tracking-[0.3em] uppercase mb-3">
              {t(lang, "dmlv_subtitle")}
            </p>
            <h2 className="font-['Cormorant_Garamond'] text-4xl md:text-5xl font-light text-white">
              {t(lang, "dmlv_title")}
            </h2>
            <div className="mt-4 mx-auto w-24 h-0.5 bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent" />
          </AnimatedSection>
          <DmlvEvents />
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="bg-[oklch(0.12_0.04_240)] border-t border-white/10 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
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
            <div>
              <h4 className="font-['Cormorant_Garamond'] text-[var(--gold)] text-lg mb-4">
                {lang === "vi" ? "Liên Hệ" : "Contact"}
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-white/60 font-['Be_Vietnam_Pro'] text-sm">
                  <MapPin className="w-4 h-4 text-[var(--gold)]" />
                  <span>{t(lang, "dmlv_location")}</span>
                </div>
                <div className="flex items-center gap-2 text-white/60 font-['Be_Vietnam_Pro'] text-sm">
                  <Mail className="w-4 h-4 text-[var(--gold)]" />
                  <span>thanhlinh.choir@gmail.com</span>
                </div>
                <div className="flex items-center gap-2 text-white/60 font-['Be_Vietnam_Pro'] text-sm">
                  <Phone className="w-4 h-4 text-[var(--gold)]" />
                  <span>(+84) 123 456 789</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-['Cormorant_Garamond'] text-[var(--gold)] text-lg mb-4">
                {lang === "vi" ? "Nhanh Chóng" : "Quick Links"}
              </h4>
              <div className="space-y-2">
                {[
                  { href: "#about", label: t(lang, "nav_about") },
                  { href: "#gallery", label: t(lang, "nav_gallery") },
                  { href: "#booking", label: t(lang, "nav_booking") },
                  { href: "#events", label: t(lang, "nav_events") },
                ].map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="block text-white/60 hover:text-[var(--gold)] font-['Be_Vietnam_Pro'] text-sm transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 text-center">
            <p className="font-['Be_Vietnam_Pro'] text-white/30 text-xs">
              © {new Date().getFullYear()} Ca Đoàn Thánh Linh. {lang === "vi" ? "Mọi quyền được bảo lưu." : "All rights reserved."}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
