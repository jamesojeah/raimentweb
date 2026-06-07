"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const SLIDES = [
  {
    id: 0,
    tag: "New Arrivals",
    title: "Fresh Drops",
    subtitle: "Shop the latest season picks",
    cta: "Shop Now",
    from: "#7C3AED",
    to: "#A78BFA",
  },
  {
    id: 1,
    tag: "Premium Collection",
    title: "Elevated Style",
    subtitle: "Curated pieces for every occasion",
    cta: "Explore",
    from: "#6D28D9",
    to: "#8B5CF6",
  },
  {
    id: 2,
    tag: "Best Sellers",
    title: "Fan Favourites",
    subtitle: "Loved by thousands of shoppers",
    cta: "View All",
    from: "#5B21B6",
    to: "#7C3AED",
  },
];

export default function Hero() {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % SLIDES.length);
    }, 4000);
  }, []);

  useEffect(() => {
    startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [startTimer]);

  const goTo = (i: number) => {
    setCurrent(i);
    startTimer();
  };

  const slide = SLIDES[current];

  return (
    <div
      className="relative overflow-hidden rounded-2xl h-52 sm:h-64 md:h-72"
      style={{
        border: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
      }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="absolute inset-0 flex flex-col justify-center px-7 sm:px-10"
        >
          {/* Gradient mesh background */}
          <div
            className="absolute inset-0"
            style={{
              background: `
                radial-gradient(ellipse at 15% 55%, ${slide.from}bb 0%, transparent 55%),
                radial-gradient(ellipse at 90% 20%, ${slide.to}88 0%, transparent 50%),
                radial-gradient(ellipse at 60% 90%, rgba(0,0,0,0.6) 0%, transparent 60%),
                rgba(5, 2, 14, 0.65)
              `,
            }}
          />

          {/* Decorative grid overlay */}
          <div
            className="absolute right-0 top-0 h-full w-2/5 pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
              maskImage: "linear-gradient(to left, black, transparent)",
              WebkitMaskImage: "linear-gradient(to left, black, transparent)",
            }}
          />

          {/* Decorative rings */}
          <div
            className="absolute -right-14 top-1/2 -translate-y-1/2 w-64 h-64 rounded-full pointer-events-none"
            style={{ border: "1px solid rgba(255,255,255,0.06)" }}
          />
          <div
            className="absolute -right-4 top-1/2 -translate-y-1/2 w-40 h-40 rounded-full pointer-events-none"
            style={{ border: "1px solid rgba(124,58,237,0.18)" }}
          />

          {/* Content */}
          <div className="relative z-10">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.4 }}
              className="inline-block text-[10px] uppercase tracking-[0.25em] font-semibold mb-3 px-3 py-1 rounded-full"
              style={{
                color: "rgba(167,139,250,0.95)",
                background: "rgba(124,58,237,0.18)",
                border: "1px solid rgba(124,58,237,0.28)",
              }}
            >
              {slide.tag}
            </motion.span>

            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16, duration: 0.5 }}
              className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2 leading-tight tracking-tight"
            >
              {slide.title}
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24, duration: 0.5 }}
              className="text-white/50 text-sm mb-5 sm:mb-6"
            >
              {slide.subtitle}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.32, duration: 0.5 }}
            >
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold tracking-wide rounded-full transition-all hover:scale-105 cursor-pointer"
                style={{
                  background: "rgba(255,255,255,0.92)",
                  color: "#7C3AED",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.35)",
                }}
              >
                {slide.cta}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Slide dots */}
      <div className="absolute bottom-4 right-5 flex gap-1.5 z-10">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`rounded-full transition-all duration-300 cursor-pointer ${
              i === current ? "w-5 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/25"
            }`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
