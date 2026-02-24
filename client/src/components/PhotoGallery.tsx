import { useLang } from "@/contexts/LangContext";
import { t } from "@/lib/i18n";

// Choir photo placeholders using picsum with consistent seeds
const galleryRow1 = [
  { id: 1, src: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=280&fit=crop", alt: "Choir singing" },
  { id: 2, src: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=280&fit=crop", alt: "Choir performance" },
  { id: 3, src: "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=400&h=280&fit=crop", alt: "Music notes" },
  { id: 4, src: "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=400&h=280&fit=crop", alt: "Choir concert" },
  { id: 5, src: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400&h=280&fit=crop", alt: "Church music" },
  { id: 6, src: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=400&h=280&fit=crop", alt: "Choir rehearsal" },
];

const galleryRow2 = [
  { id: 7, src: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=280&fit=crop", alt: "Musical performance" },
  { id: 8, src: "https://images.unsplash.com/photo-1470019693664-1d202d2c0907?w=400&h=280&fit=crop", alt: "Church choir" },
  { id: 9, src: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=400&h=280&fit=crop", alt: "Choir event" },
  { id: 10, src: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&h=280&fit=crop", alt: "Sacred music" },
  { id: 11, src: "https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?w=400&h=280&fit=crop", alt: "Choir members" },
  { id: 12, src: "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=400&h=280&fit=crop", alt: "Choir harmony" },
];

function GalleryImage({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative w-[300px] h-[200px] flex-shrink-0 rounded-xl overflow-hidden group cursor-pointer shadow-md hover:shadow-xl transition-shadow duration-300">
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.18_0.06_240)/60] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
        <div className="w-8 h-0.5 bg-[var(--gold)]" />
      </div>
    </div>
  );
}

export default function PhotoGallery() {
  const { lang } = useLang();

  // Duplicate for seamless loop
  const row1 = [...galleryRow1, ...galleryRow1];
  const row2 = [...galleryRow2, ...galleryRow2];

  return (
    <section id="gallery" className="py-20 bg-[oklch(0.18_0.06_240)] overflow-hidden">
      {/* Section header */}
      <div className="text-center mb-12 px-4">
        <p className="text-[var(--gold)] font-['Be_Vietnam_Pro'] text-sm tracking-[0.3em] uppercase mb-3">
          {t(lang, "gallery_subtitle")}
        </p>
        <h2 className="font-['Cormorant_Garamond'] text-4xl md:text-5xl font-light text-white">
          {t(lang, "gallery_title")}
        </h2>
        <div className="mt-4 mx-auto w-24 h-0.5 bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent" />
      </div>

      {/* Row 1 — scrolls left */}
      <div className="relative mb-4">
        <div className="flex gap-4 gallery-track-left" style={{ width: "max-content" }}>
          {row1.map((img, i) => (
            <GalleryImage key={`r1-${i}`} src={img.src} alt={img.alt} />
          ))}
        </div>
        {/* Edge fade */}
        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[oklch(0.18_0.06_240)] to-transparent pointer-events-none z-10" />
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[oklch(0.18_0.06_240)] to-transparent pointer-events-none z-10" />
      </div>

      {/* Row 2 — scrolls right */}
      <div className="relative">
        <div className="flex gap-4 gallery-track-right" style={{ width: "max-content" }}>
          {row2.map((img, i) => (
            <GalleryImage key={`r2-${i}`} src={img.src} alt={img.alt} />
          ))}
        </div>
        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[oklch(0.18_0.06_240)] to-transparent pointer-events-none z-10" />
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[oklch(0.18_0.06_240)] to-transparent pointer-events-none z-10" />
      </div>
    </section>
  );
}
