"use client";
import { useState, MouseEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { useCart } from "@/hooks/useCart";
import type { Product } from "@/types/product";

interface Props {
  product: Product;
  index?: number;
}

function isSoldOut(product: Product): boolean {
  if (product.stockQuantity !== undefined) return product.stockQuantity === 0;
  return product.inStock === false;
}

export default function ProductCard({ product, index = 0 }: Props) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [glowPos, setGlowPos] = useState({ x: 50, y: 50 });

  const image = product.images?.[0];
  const soldOut = isSoldOut(product);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [10, -10]), { stiffness: 200, damping: 25 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-10, 10]), { stiffness: 200, damping: 25 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;
    mouseX.set(nx - 0.5);
    mouseY.set(ny - 0.5);
    setGlowPos({ x: nx * 100, y: ny * 100 });
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setHovering(false);
  };

  const handleAddToCart = (e: MouseEvent) => {
    e.preventDefault();
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: index * 0.06 }}
      style={{ perspective: "1000px" }}
    >
      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseEnter={() => setHovering(true)}
      >
        <Link href={`/products/${product.id}`} className="block group cursor-pointer">
          <div
            className="relative rounded-2xl overflow-hidden transition-shadow duration-300"
            style={{
              background: "rgba(255,255,255,0.04)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.07)",
              boxShadow: hovering
                ? "0 20px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(124,58,237,0.22)"
                : "0 4px 20px rgba(0,0,0,0.3)",
              transition: "box-shadow 0.3s ease",
            }}
          >
            {/* Radial glow follows cursor */}
            <div
              className="absolute inset-0 rounded-2xl pointer-events-none z-10 transition-opacity duration-300"
              style={{
                opacity: hovering ? 1 : 0,
                background: `radial-gradient(circle at ${glowPos.x}% ${glowPos.y}%, rgba(124,58,237,0.2) 0%, transparent 55%)`,
              }}
            />

            {/* Image */}
            <div
              className="relative aspect-square overflow-hidden"
              style={{ background: "rgba(124,58,237,0.07)" }}
            >
              {image && !imgError ? (
                <Image
                  src={image}
                  alt={product.name ?? "Product image"}
                  fill
                  unoptimized
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(124,58,237,0.18) 0%, rgba(109,40,217,0.08) 100%)",
                  }}
                >
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="rgba(167,139,250,0.45)"
                    strokeWidth="1.5"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                </div>
              )}

              {/* Bottom gradient on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {soldOut && (
                <span
                  className="absolute top-2.5 left-2.5 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide"
                  style={{ background: "rgba(239,68,68,0.85)", backdropFilter: "blur(8px)" }}
                >
                  Sold Out
                </span>
              )}

              <button
                onClick={(e) => { e.preventDefault(); setWishlisted((w) => !w); }}
                className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90 cursor-pointer"
                style={{
                  background: "rgba(0,0,0,0.45)",
                  backdropFilter: "blur(8px)",
                  border: wishlisted
                    ? "1px solid rgba(167,139,250,0.5)"
                    : "1px solid rgba(255,255,255,0.12)",
                }}
                aria-label="Wishlist"
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill={wishlisted ? "#A78BFA" : "none"}
                  stroke={wishlisted ? "#A78BFA" : "rgba(255,255,255,0.65)"}
                  strokeWidth="2"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                </svg>
              </button>
            </div>

            {/* Info */}
            <div className="p-3.5">
              <p
                className="text-[10px] uppercase tracking-[0.18em] mb-0.5 truncate font-medium"
                style={{ color: "rgba(167,139,250,0.6)" }}
              >
                {product.category}
              </p>
              <h3
                className="text-sm font-semibold mb-2 line-clamp-1"
                style={{ color: "rgba(255,255,255,0.88)" }}
              >
                {product.name}
              </h3>
              <p className="font-bold text-sm mb-3" style={{ color: "#A78BFA" }}>
                ₦{product.price.toLocaleString()}
              </p>
              <button
                onClick={handleAddToCart}
                disabled={soldOut}
                className="w-full py-2.5 text-xs font-bold tracking-wide text-white rounded-xl transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: added
                    ? "rgba(109,40,217,0.7)"
                    : "linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)",
                  boxShadow: added ? "none" : "0 4px 14px rgba(124,58,237,0.38)",
                  transition: "background 0.2s, box-shadow 0.2s",
                }}
              >
                {added ? "Added ✓" : "Add to Cart"}
              </button>
            </div>
          </div>
        </Link>
      </motion.div>
    </motion.div>
  );
}
