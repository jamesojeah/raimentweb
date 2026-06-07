"use client";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import ProductCard from "@/components/ProductCard";
import ProductSkeleton from "@/components/ProductSkeleton";
import { useProducts } from "@/hooks/useProducts";

const SORT_OPTIONS = [
  { label: "Newest", value: "newest" },
  { label: "Price: Low to High", value: "price-asc" },
  { label: "Price: High to Low", value: "price-desc" },
  { label: "Name A–Z", value: "name" },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]["value"];

export default function ProductsPage() {
  const { products, loading, error } = useProducts();
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [sort, setSort] = useState<SortValue>("newest");

  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map((p) => p.category)));
    return ["All", ...cats];
  }, [products]);

  const filtered = useMemo(() => {
    let list = activeCategory === "All" ? products : products.filter((p) => p.category === activeCategory);
    switch (sort) {
      case "price-asc": return [...list].sort((a, b) => a.price - b.price);
      case "price-desc": return [...list].sort((a, b) => b.price - a.price);
      case "name": return [...list].sort((a, b) => a.name.localeCompare(b.name));
      default: return list;
    }
  }, [products, activeCategory, sort]);

  return (
    <div className="min-h-screen bg-[#F8F7FF]">
      {/* Purple header */}
      <div
        className="pt-[62px] pb-6 px-4"
        style={{ background: "linear-gradient(180deg, #7C3AED 0%, #6D28D9 100%)" }}
      >
        <div className="max-w-7xl mx-auto pt-4">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-white/70 text-xs uppercase tracking-widest mb-1 font-medium"
          >
            The Edit
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="font-serif text-3xl sm:text-4xl text-white font-bold"
          >
            All Products
          </motion.h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-5 pb-16">
        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
          <div className="flex flex-wrap gap-2">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-8 w-20 bg-white rounded-full animate-pulse shadow-sm" />
                ))
              : categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer border ${
                      activeCategory === cat
                        ? "bg-[#7C3AED] text-white border-[#7C3AED] shadow-sm"
                        : "bg-white text-gray-500 border-gray-200 hover:border-purple-300 hover:text-[#7C3AED]"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortValue)}
            className="bg-white border border-gray-200 text-gray-600 text-xs rounded-xl px-4 py-2 focus:outline-none focus:border-[#7C3AED] transition-colors cursor-pointer appearance-none pr-8 shadow-sm"
            style={{
              backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 12px center",
            }}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {!loading && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-gray-400 mb-5"
          >
            {filtered.length} {filtered.length === 1 ? "product" : "products"}
          </motion.p>
        )}

        {error ? (
          <div className="text-center py-20 text-gray-400 text-sm">{error}</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {loading
              ? Array.from({ length: 12 }).map((_, i) => <ProductSkeleton key={i} />)
              : filtered.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        )}

        {!loading && filtered.length === 0 && !error && (
          <div className="text-center py-20 text-gray-400 text-sm">
            No products found in this category.
          </div>
        )}
      </div>
    </div>
  );
}
