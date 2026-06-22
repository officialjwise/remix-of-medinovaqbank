import { useEffect, useState } from "react";
import dashboardImg from "@/assets/hero-dashboard.png";
import quizImg from "@/assets/hero-quiz.png";
import analyticsImg from "@/assets/hero-analytics.png";

const slides = [
  { src: dashboardImg, label: "Dashboard", caption: "Your daily learning hub" },
  { src: quizImg, label: "Quiz Mode", caption: "Real exam-style vignettes" },
  { src: analyticsImg, label: "Analytics", caption: "Bell-curve performance vs. peers" },
];

export function RotatingHero() {
  const [i, setI] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % slides.length), 4500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative">
      {/* Glow */}
      <div
        aria-hidden
        className="absolute -inset-12 -z-10 rounded-[2.5rem] opacity-50 blur-3xl"
        style={{ background: "radial-gradient(closest-side, #2BC97F33, transparent 70%)" }}
      />

      <div className="relative aspect-[1280/896] w-full overflow-hidden rounded-2xl bg-white/5 shadow-[0_30px_80px_-20px_rgb(0_0_0_/_0.5)] ring-1 ring-white/10">
        {slides.map((s, idx) => (
          <img
            key={s.src}
            src={s.src}
            alt={`Medinovaqbank ${s.label} preview`}
            width={1280}
            height={896}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
              i === idx ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
      </div>

      {/* Caption + dots */}
      <div className="mt-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">
            {slides[i].label}
          </p>
          <p className="mt-1 text-sm font-medium text-white/85">{slides[i].caption}</p>
        </div>
        <div className="flex items-center gap-1.5">
          {slides.map((s, idx) => (
            <button
              key={s.src}
              type="button"
              onClick={() => setI(idx)}
              aria-label={`Show ${s.label}`}
              className={`h-1.5 rounded-full transition-all ${
                i === idx ? "w-8 bg-[#2BC97F]" : "w-1.5 bg-white/30 hover:bg-white/50"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
