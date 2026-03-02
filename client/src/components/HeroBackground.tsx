import { useEffect, useRef } from "react";
import { useSeason } from "@/contexts/SeasonContext";

/**
 * Animated hero background:
 * - Base image (choir/church photo)
 * - Canvas particle system (floating light orbs)
 * - Season-tinted gradient overlay that changes with liturgical season
 */

interface Particle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  opacity: number;
  opacityDelta: number;
  hue: number;
}

function createParticle(width: number, height: number, hue: number): Particle {
  return {
    x: Math.random() * width,
    y: height + Math.random() * 100,
    size: Math.random() * 3 + 1,
    speedY: -(Math.random() * 0.6 + 0.2),
    speedX: (Math.random() - 0.5) * 0.3,
    opacity: 0,
    opacityDelta: Math.random() * 0.008 + 0.003,
    hue,
  };
}

// Extract hue from OKLCH string like "oklch(0.78 0.16 75)" → 75
function extractHue(oklchStr: string): number {
  const match = oklchStr.match(/oklch\([^)]+\s+([0-9.]+)\)/);
  return match ? parseFloat(match[1]) : 75;
}

export default function HeroBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useSeason();
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = canvas.offsetWidth;
    let height = canvas.offsetHeight;
    canvas.width = width;
    canvas.height = height;

    const hue = extractHue(theme.primary);
    const PARTICLE_COUNT = 60;
    const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, () =>
      createParticle(width, height, hue)
    );
    // Scatter initial positions
    particles.forEach((p) => {
      p.y = Math.random() * height;
      p.opacity = Math.random() * 0.6;
    });

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      for (const p of particles) {
        // Update
        p.y += p.speedY;
        p.x += p.speedX;
        p.opacity += p.opacityDelta;

        if (p.opacity > 0.7) p.opacityDelta = -Math.abs(p.opacityDelta);
        if (p.opacity < 0) {
          // Respawn
          Object.assign(p, createParticle(width, height, hue));
          continue;
        }
        if (p.y < -20) {
          Object.assign(p, createParticle(width, height, hue));
          continue;
        }

        // Draw glow
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
        gradient.addColorStop(0, `hsla(${p.hue}, 80%, 75%, ${p.opacity})`);
        gradient.addColorStop(0.5, `hsla(${p.hue}, 70%, 60%, ${p.opacity * 0.4})`);
        gradient.addColorStop(1, `hsla(${p.hue}, 60%, 50%, 0)`);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Core dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 90%, 90%, ${p.opacity * 0.9})`;
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(draw);
    }

    draw();

    const handleResize = () => {
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", handleResize);
    };
  }, [theme.primary]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Base choir image */}
      <img
        src="https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=1920&h=1080&fit=crop&q=80"
        alt=""
        aria-hidden="true"
        className="w-full h-full object-cover scale-105"
        style={{ filter: "brightness(0.45) saturate(0.7)" }}
      />

      {/* Season-tinted gradient overlay */}
      <div
        className="absolute inset-0 transition-all duration-1000"
        style={{ background: theme.heroOverlay }}
      />

      {/* Animated particle canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ mixBlendMode: "screen", opacity: 0.6 }}
      />

      {/* Radial vignette for depth */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 40%, transparent 30%, oklch(0 0 0 / 0.5) 100%)",
        }}
      />

      {/* Subtle cross/light rays from top */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 40% 50% at 50% -10%, oklch(from var(--gold) l c h / 0.12) 0%, transparent 70%)`,
        }}
      />
    </div>
  );
}
