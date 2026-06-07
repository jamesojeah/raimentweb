"use client";
import React, { useState, useMemo, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Loader from "@/components/Loader";
import Hero from "@/components/Hero";
import ProductCard from "@/components/ProductCard";
import ProductSkeleton from "@/components/ProductSkeleton";
import BrandStory from "@/components/BrandStory";
import Newsletter from "@/components/Newsletter";
import { useProducts } from "@/hooks/useProducts";
import { useRouter } from "next/navigation";
import SectionVideoBackground from "@/components/SectionVideoBackground";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  All: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
    </svg>
  ),
  Clothing: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.57a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.57a2 2 0 00-1.34-2.23z" />
    </svg>
  ),
  Electronics: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
    </svg>
  ),
  Home: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  Beauty: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2a7 7 0 017 7c0 5-7 13-7 13S5 14 5 9a7 7 0 017-7z" />
      <circle cx="12" cy="9" r="2" />
    </svg>
  ),
  Sports: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </svg>
  ),
};

function getCategoryIcon(cat: string) {
  return CATEGORY_ICONS[cat] ?? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}

export default function HomePage() {
  const [loaderDone, setLoaderDone] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const { products, loading } = useProducts();
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const seen = sessionStorage.getItem("raiment-intro-seen");
    if (!seen) {
      setShowLoader(true);
      sessionStorage.setItem("raiment-intro-seen", "1");
    } else {
      setLoaderDone(true);
    }
  }, []);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map((p) => p.category)));
    return ["All", ...cats];
  }, [products]);

  const featured = useMemo(() => {
    const base =
      activeCategory === "All"
        ? products
        : products.filter((p) => p.category === activeCategory);
    return base.slice(0, 8);
  }, [products, activeCategory]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <>
      {showLoader && !loaderDone && (
        <Loader onComplete={() => setLoaderDone(true)} />
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: loaderDone ? 1 : 0 }}
        transition={{ duration: 0.5 }}
        className="pt-[76px]"
      >
        {/* ── Announcement bar ───────────────────────────────────────────── */}
        <div
          className="text-center py-2.5 text-[11px] tracking-[0.14em]"
          style={{
            background: "rgba(6, 3, 16, 0.88)",
            borderBottom: "1px solid rgba(124,58,237,0.1)",
            color: "rgba(255,255,255,0.38)",
          }}
        >
          Use code{" "}
          <span style={{ color: "#A78BFA", fontWeight: 600 }}>RAIMENT20</span>
          {" "}for 20% off your first order
        </div>

        {/* ── Greeting + search + hero banner ────────────────────────────── */}
        <section style={{ background: "rgba(6, 3, 16, 0.72)" }}>
          <div className="max-w-7xl mx-auto px-4 pt-6 pb-6">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: loaderDone ? 1 : 0, y: loaderDone ? 0 : 12 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <h1 className="text-white text-xl font-bold mb-0.5">Hey there</h1>
              <p className="text-white/40 text-sm mb-4">What are you shopping for today?</p>
            </motion.div>

            {/* Search */}
            <motion.form
              onSubmit={handleSearch}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: loaderDone ? 1 : 0, y: loaderDone ? 0 : 12 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative"
            >
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgba(255,255,255,0.28)"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="w-full pl-11 pr-4 py-3.5 text-sm text-white placeholder-white/22 focus:outline-none transition-all duration-200"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: searchFocused
                    ? "1px solid rgba(124,58,237,0.55)"
                    : "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "1rem",
                  boxShadow: searchFocused ? "0 0 0 3px rgba(124,58,237,0.12)" : "none",
                }}
              />
            </motion.form>
          </div>

          {/* Banner slider */}
          <div className="max-w-7xl mx-auto px-4 pb-6">
            <Hero />
          </div>
        </section>

        {/* ── Products area ──────────────────────────────────────────────── */}
        <div className="relative overflow-hidden pb-16" style={{ background: "rgba(8, 4, 20, 0.1)" }}>
          <SectionVideoBackground
            src="https://stream.mux.com/4IMYGcL01xjs7ek5ANO17JC4VQVUTsojZlnw4fXzwSxc.m3u8"
            overlayOpacity={0.78}
          />
          {/* Category chips */}
          <div className="relative z-10 max-w-7xl mx-auto px-4 pt-5 pb-1">
            <div
              className="flex gap-2.5 overflow-x-auto pb-2"
              style={{ scrollbarWidth: "none" }}
            >
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-10 w-20 rounded-full animate-pulse flex-shrink-0"
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.07)",
                      }}
                    />
                  ))
                : categories.map((cat) => {
                    const active = activeCategory === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className="flex-shrink-0 flex flex-col items-center gap-1 px-4 py-2 rounded-full text-xs font-medium transition-all cursor-pointer"
                        style={{
                          background: active
                            ? "linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)"
                            : "rgba(255,255,255,0.04)",
                          border: active
                            ? "1px solid rgba(124,58,237,0.55)"
                            : "1px solid rgba(255,255,255,0.07)",
                          color: active ? "white" : "rgba(255,255,255,0.42)",
                          boxShadow: active ? "0 4px 14px rgba(124,58,237,0.32)" : "none",
                        }}
                      >
                        <span style={{ color: active ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.35)" }}>
                          {getCategoryIcon(cat)}
                        </span>
                        {cat}
                      </button>
                    );
                  })}
            </div>
          </div>

          {/* Featured Products */}
          <section className="relative z-10 max-w-7xl mx-auto px-4 pt-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold" style={{ color: "rgba(255,255,255,0.88)" }}>
                Featured Products
              </h2>
              <Link
                href="/products"
                className="text-xs font-semibold transition-colors"
                style={{ color: "#A78BFA" }}
              >
                See all
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {loading
                ? Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)
                : featured.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>

            {!loading && featured.length === 0 && (
              <div className="text-center py-16 text-sm" style={{ color: "rgba(255,255,255,0.25)" }}>
                No products found. Check your Firebase connection.
              </div>
            )}

            {!loading && products.length > 8 && (
              <div className="mt-10 text-center">
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 px-8 py-3.5 text-white text-sm font-semibold rounded-full transition-all hover:scale-105 cursor-pointer"
                  style={{
                    background: "linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)",
                    boxShadow: "0 8px 28px rgba(124,58,237,0.42)",
                  }}
                >
                  View All Products
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            )}
          </section>
        </div>

        {/* Brand story & newsletter */}
        <BrandStory />
        <Newsletter />
      </motion.div>
    </>
  );
}
