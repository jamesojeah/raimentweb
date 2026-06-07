"use client";
import { useState, useEffect } from "react";
import { use } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { fetchProductById, fetchProductsByCategory } from "@/lib/firestore";
import type { Product } from "@/types/product";
import { useCart } from "@/hooks/useCart";
import ProductCard from "@/components/ProductCard";
import SectionVideoBackground from "@/components/SectionVideoBackground";
import Link from "next/link";

const PRODUCTS_VIDEO = "https://stream.mux.com/4IMYGcL01xjs7ek5ANO17JC4VQVUTsojZlnw4fXzwSxc.m3u8";

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();

  useEffect(() => {
    setLoading(true);
    fetchProductById(id).then((p) => {
      setProduct(p);
      setLoading(false);
      if (p) {
        fetchProductsByCategory(p.category, p.id, 4).then(setRelated);
      }
    });
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) {
    return (
      <div className="relative min-h-screen overflow-hidden pt-[76px]">
        <SectionVideoBackground src={PRODUCTS_VIDEO} overlayOpacity={0.82} />
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
          <div className="h-3 w-32 rounded-full animate-pulse mb-3" style={{ background: "rgba(255,255,255,0.08)" }} />
          <div className="h-7 w-48 rounded-full animate-pulse mb-10" style={{ background: "rgba(255,255,255,0.06)" }} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="aspect-square rounded-2xl animate-pulse" style={{ background: "rgba(124,58,237,0.1)" }} />
            <div className="space-y-4 pt-2">
              <div className="h-3 w-20 rounded-full animate-pulse" style={{ background: "rgba(167,139,250,0.12)" }} />
              <div className="h-8 w-3/4 rounded-full animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />
              <div className="h-6 w-24 rounded-full animate-pulse" style={{ background: "rgba(124,58,237,0.14)" }} />
              <div className="space-y-2 mt-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-4 rounded animate-pulse" style={{ background: "rgba(255,255,255,0.05)" }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="relative min-h-screen overflow-hidden pt-[76px] flex items-center justify-center">
        <SectionVideoBackground src={PRODUCTS_VIDEO} overlayOpacity={0.82} />
        <div className="relative z-10 text-center">
          <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.35)" }}>Product not found.</p>
          <Link
            href="/products"
            className="text-sm font-semibold transition-colors"
            style={{ color: "#A78BFA" }}
          >
            Back to Collection
          </Link>
        </div>
      </div>
    );
  }

  const images = product.images?.length > 0 ? product.images : ["/placeholder.jpg"];
  const isSoldOut = product.stockQuantity !== undefined
    ? product.stockQuantity === 0
    : product.inStock === false;

  return (
    <div className="relative min-h-screen overflow-hidden pt-[76px]">
      <SectionVideoBackground src={PRODUCTS_VIDEO} overlayOpacity={0.8} />

      {/* Breadcrumb + title header */}
      <div
        className="relative z-10 px-4 py-5"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div className="max-w-7xl mx-auto">
          <nav className="flex items-center gap-1.5 text-xs mb-2" style={{ color: "rgba(255,255,255,0.35)" }}>
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <Link href="/products" className="hover:text-white transition-colors">Shop</Link>
            <span>/</span>
            <span className="truncate max-w-[160px]" style={{ color: "rgba(255,255,255,0.7)" }}>
              {product.name}
            </span>
          </nav>
          <h1 className="font-serif text-2xl font-bold leading-tight line-clamp-1 text-white">
            {product.name}
          </h1>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 pt-6 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14">

          {/* Image gallery */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div
              className="relative aspect-square rounded-2xl overflow-hidden mb-3"
              style={{
                background: "rgba(124,58,237,0.08)",
                border: "1px solid rgba(255,255,255,0.07)",
                boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
              }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeImage}
                  initial={{ opacity: 0, scale: 1.04 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  className="absolute inset-0"
                >
                  <Image
                    src={images[activeImage]}
                    alt={`${product.name} — image ${activeImage + 1}`}
                    fill
                    unoptimized
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                    priority={activeImage === 0}
                  />
                </motion.div>
              </AnimatePresence>

              {isSoldOut && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span
                    className="text-white text-xs font-bold px-4 py-1.5 rounded-full"
                    style={{ background: "rgba(239,68,68,0.85)", backdropFilter: "blur(8px)" }}
                  >
                    Sold Out
                  </span>
                </div>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto pb-1">
                {images.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className="relative flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden transition-all cursor-pointer"
                    style={{
                      border: i === activeImage
                        ? "2px solid #7C3AED"
                        : "2px solid rgba(255,255,255,0.08)",
                      opacity: i === activeImage ? 1 : 0.5,
                      boxShadow: i === activeImage ? "0 0 0 3px rgba(124,58,237,0.2)" : "none",
                    }}
                  >
                    <Image src={src} alt={`Thumbnail ${i + 1}`} fill unoptimized sizes="64px" className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Product info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col"
          >
            <p
              className="text-xs uppercase tracking-widest mb-2 font-semibold"
              style={{ color: "#A78BFA" }}
            >
              {product.category}
            </p>

            <h2
              className="font-serif text-2xl sm:text-3xl mb-3 leading-tight font-bold"
              style={{ color: "rgba(255,255,255,0.92)" }}
            >
              {product.name}
            </h2>

            <p className="text-2xl font-bold mb-6" style={{ color: "#A78BFA" }}>
              ₦{product.price.toLocaleString()}
            </p>

            <p className="text-sm leading-[1.9] mb-6" style={{ color: "rgba(255,255,255,0.42)" }}>
              {product.description}
            </p>

            {product.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {product.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] px-3 py-1 rounded-full uppercase tracking-wide font-medium"
                    style={{
                      background: "rgba(124,58,237,0.14)",
                      border: "1px solid rgba(124,58,237,0.28)",
                      color: "#A78BFA",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <button
              onClick={handleAddToCart}
              disabled={isSoldOut}
              className="w-full py-4 rounded-2xl text-sm font-bold tracking-wide transition-all cursor-pointer mb-3 text-white"
              style={
                isSoldOut
                  ? { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.25)", cursor: "not-allowed" }
                  : added
                  ? { background: "rgba(34,197,94,0.8)", boxShadow: "0 8px 24px rgba(34,197,94,0.25)" }
                  : {
                      background: "linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)",
                      boxShadow: "0 8px 28px rgba(124,58,237,0.42)",
                    }
              }
            >
              {isSoldOut ? "Sold Out" : added ? "Added to Cart ✓" : "Add to Cart"}
            </button>

            <Link
              href="/cart"
              className="w-full py-3.5 rounded-2xl text-sm text-center font-semibold transition-all hover:bg-white/5"
              style={{
                border: "1px solid rgba(124,58,237,0.35)",
                color: "#A78BFA",
              }}
            >
              View Cart
            </Link>

            {/* Info pills */}
            <div
              className="mt-8 pt-5 space-y-3"
              style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
            >
              {[
                { icon: "M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z", label: "Secure payment processing" },
                { icon: "M9 14l-5-5 1.5-1.5L9 11l9.5-9.5L20 3z", label: "30-day easy returns" },
                { icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z", label: "Quality guaranteed" },
              ].map(({ icon, label }) => (
                <div key={label} className="flex items-center gap-3 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.5">
                    <path d={icon} />
                  </svg>
                  {label}
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <section
            className="mt-16 pt-10"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            <h2
              className="font-serif text-2xl font-bold mb-6"
              style={{ color: "rgba(255,255,255,0.88)" }}
            >
              You May Also Like
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {related.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
