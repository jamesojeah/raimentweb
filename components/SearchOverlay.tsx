"use client";
import { useEffect, useRef, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchStore } from "@/store/searchStore";
import { useProducts } from "@/hooks/useProducts";

function highlight(text: string, query: string) {
  if (!query.trim()) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-purple-200 text-purple-900 rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export default function SearchOverlay() {
  const { isOpen, close } = useSearchStore();
  const { products, loading } = useProducts();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Auto-focus + clear query on open
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.tags?.some((t) => t.toLowerCase().includes(q))
    );
  }, [query, products]);

  const handleSelect = (id: string) => {
    close();
    router.push(`/products/${id}`);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[300] flex flex-col"
          style={{ background: "rgba(7, 3, 18, 0.92)", backdropFilter: "blur(20px)" }}
        >
          {/* Header row */}
          <div className="flex items-center gap-3 px-4 sm:px-8 pt-6 pb-4 border-b border-white/10">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" className="flex-shrink-0">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products, categories, tags…"
              className="flex-1 bg-transparent text-white text-lg placeholder-white/30 outline-none"
              autoComplete="off"
              spellCheck={false}
            />
            <button
              onClick={close}
              className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close search"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-4">
            {loading && query.trim() && (
              <p className="text-white/40 text-sm text-center py-12">Loading products…</p>
            )}

            {!loading && query.trim() === "" && (
              <div className="text-center py-16">
                <p className="text-white/25 text-sm">Start typing to search</p>
              </div>
            )}

            {!loading && query.trim() !== "" && results.length === 0 && (
              <div className="text-center py-16">
                <p className="text-white/40 text-sm">
                  No products found for &ldquo;<span className="text-purple-400">{query}</span>&rdquo;
                </p>
              </div>
            )}

            {results.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18 }}
              >
                <p className="text-white/30 text-xs mb-4">
                  {results.length} result{results.length !== 1 ? "s" : ""}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {results.map((product) => {
                    const image = product.images?.[0];
                    return (
                      <button
                        key={product.id}
                        onClick={() => handleSelect(product.id)}
                        className="group text-left rounded-xl overflow-hidden border border-white/10 hover:border-purple-500/60 transition-all duration-200 cursor-pointer"
                        style={{ background: "rgba(255,255,255,0.04)" }}
                      >
                        {/* Image */}
                        <div className="relative aspect-square bg-white/5 overflow-hidden">
                          {image ? (
                            <Image
                              src={image}
                              alt={product.name}
                              fill
                              sizes="(max-width: 640px) 50vw, 20vw"
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5">
                                <rect x="3" y="3" width="18" height="18" rx="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <path d="M21 15l-5-5L5 21" />
                              </svg>
                            </div>
                          )}
                        </div>
                        {/* Info */}
                        <div className="p-2.5">
                          <p className="text-[10px] text-purple-400/80 uppercase tracking-wide mb-0.5 truncate">
                            {product.category}
                          </p>
                          <p className="text-white text-xs font-medium leading-snug line-clamp-2">
                            {highlight(product.name, query)}
                          </p>
                          <p className="text-purple-300 text-xs font-semibold mt-1">
                            ₦{product.price.toLocaleString()}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
