"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCursor } from "@/hooks/useCursor";
import { useCart } from "@/hooks/useCart";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { onHover, onLeave } = useCursor();
  const { itemCount } = useCart();
  const count = itemCount();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
      className="fixed top-3 left-3 right-3 z-[200]"
    >
      <nav
        className="max-w-6xl mx-auto flex items-center justify-between px-5 py-3 transition-all duration-500"
        style={{
          background: scrolled ? "rgba(7, 3, 18, 0.96)" : "rgba(7, 3, 18, 0.6)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(124, 58, 237, 0.22)",
          borderRadius: "2rem",
          boxShadow: scrolled
            ? "0 8px 32px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.04)"
            : "0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          className="font-serif text-lg font-bold tracking-[0.3em] text-white uppercase"
          onMouseEnter={onHover()}
          onMouseLeave={onLeave}
        >
          Raiment
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-7">
          {[
            { label: "Shop", href: "/products" },
            { label: "About", href: "/#story" },
          ].map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className="text-sm text-white/50 hover:text-white transition-colors duration-200 tracking-wide"
              onMouseEnter={onHover(label.toUpperCase())}
              onMouseLeave={onLeave}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link
            href="/products"
            className="w-9 h-9 flex items-center justify-center rounded-full cursor-pointer transition-all duration-200 hover:scale-105"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.09)",
            }}
            aria-label="Search"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
          </Link>

          <Link
            href="/cart"
            className="relative w-9 h-9 flex items-center justify-center rounded-full cursor-pointer transition-all duration-200 hover:scale-105"
            style={{
              background: "rgba(124, 58, 237, 0.22)",
              border: "1px solid rgba(124, 58, 237, 0.4)",
            }}
            onMouseEnter={onHover("CART")}
            onMouseLeave={onLeave}
            aria-label="Cart"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
            {count > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full text-white text-[9px] font-bold flex items-center justify-center px-1"
                style={{ background: "#7C3AED", boxShadow: "0 2px 8px rgba(124,58,237,0.6)" }}
              >
                {count}
              </span>
            )}
          </Link>

          <button
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-full cursor-pointer transition-all duration-200 hover:scale-105"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.09)",
            }}
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2">
              {menuOpen ? (
                <path d="M18 6L6 18M6 6l12 12" />
              ) : (
                <>
                  <line x1="3" y1="7" x2="21" y2="7" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="17" x2="21" y2="17" />
                </>
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="max-w-6xl mx-auto mt-2 px-5 py-5 flex flex-col gap-1"
            style={{
              background: "rgba(7, 3, 18, 0.96)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: "1px solid rgba(124, 58, 237, 0.18)",
              borderRadius: "1.5rem",
              boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
            }}
          >
            {[
              { label: "Shop Collection", href: "/products" },
              { label: "Cart", href: "/cart" },
              { label: "About", href: "/#story" },
            ].map(({ label, href }, i) => (
              <Link
                key={label}
                href={href}
                className="text-sm text-white/60 hover:text-white transition-colors py-3"
                style={{
                  borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.06)" : "none",
                }}
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
