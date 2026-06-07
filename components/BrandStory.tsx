"use client";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";

export default function BrandStory() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const imgY = useTransform(scrollYProgress, [0, 1], ["10%", "-10%"]);

  return (
    <section
      id="story"
      ref={sectionRef}
      className="py-24 px-4 overflow-hidden"
      style={{ background: "rgba(5, 2, 14, 0.88)" }}
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-20 items-center">
        {/* Text */}
        <div className="order-2 lg:order-1">
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-xs uppercase tracking-[0.25em] mb-3 font-semibold"
            style={{ color: "#A78BFA" }}
          >
            Our Story
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-serif text-[clamp(2rem,4vw,3rem)] mb-6 leading-tight"
            style={{ color: "rgba(255,255,255,0.92)" }}
          >
            Craft That Endures
          </motion.h2>

          {[
            "Raiment was born from a single belief: that what you wear should outlast the moment you bought it. Each piece is sourced, considered, and built to carry you — not just cover you.",
            "We work with small-batch manufacturers who understand material integrity. No fast cycles. No wasted fabric. Just garments made to age beautifully.",
          ].map((para, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15 * i + 0.2 }}
              className="text-sm leading-[1.9] mb-4 max-w-lg"
              style={{ color: "rgba(255,255,255,0.42)" }}
            >
              {para}
            </motion.p>
          ))}

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-6"
          >
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-7 py-3 text-white text-sm font-semibold rounded-full transition-all hover:scale-105 cursor-pointer"
              style={{
                background: "linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)",
                boxShadow: "0 8px 28px rgba(124,58,237,0.38)",
              }}
            >
              Shop the Collection
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </motion.div>
        </div>

        {/* Parallax image block */}
        <div
          className="order-1 lg:order-2 relative aspect-[4/5] overflow-hidden rounded-2xl"
          style={{
            border: "1px solid rgba(255,255,255,0.07)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
          }}
        >
          <motion.div
            style={{ y: imgY }}
            className="absolute inset-[-15%] will-change-transform"
          >
            <div
              className="w-full h-full flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg, rgba(109,40,217,0.35) 0%, rgba(91,33,182,0.2) 50%, rgba(124,58,237,0.15) 100%)",
              }}
            >
              <div className="text-center space-y-3 opacity-40">
                <div className="w-16 h-px mx-auto" style={{ background: "#A78BFA" }} />
                <p className="font-serif text-4xl tracking-[0.3em]" style={{ color: "#A78BFA" }}>
                  R
                </p>
                <div className="w-16 h-px mx-auto" style={{ background: "#A78BFA" }} />
              </div>
            </div>
          </motion.div>

          {/* Glass overlay at bottom */}
          <div
            className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
            style={{
              background: "linear-gradient(to top, rgba(5,2,14,0.6), transparent)",
            }}
          />

          <div
            className="absolute bottom-5 right-5 w-11 h-11 rounded-full border flex items-center justify-center"
            style={{ borderColor: "rgba(124,58,237,0.3)" }}
          >
            <div className="w-2 h-2 rounded-full" style={{ background: "#7C3AED" }} />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div
        className="max-w-7xl mx-auto mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 pt-14"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        {[
          { value: "2019", label: "Founded" },
          { value: "500+", label: "Products" },
          { value: "40+", label: "Countries" },
          { value: "100%", label: "Sustainable" },
        ].map(({ value, label }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="text-center py-6 rounded-2xl"
            style={{
              background: "rgba(255,255,255,0.03)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(124,58,237,0.12)",
            }}
          >
            <p className="font-serif text-3xl mb-1 font-bold" style={{ color: "#A78BFA" }}>
              {value}
            </p>
            <p className="text-xs uppercase tracking-[0.2em]" style={{ color: "rgba(255,255,255,0.35)" }}>
              {label}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
