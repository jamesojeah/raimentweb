"use client";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/hooks/useCart";

export default function CartPage() {
  const { items, removeItem, updateQuantity, total, clearCart } = useCart();
  const cartTotal = total();
  const shipping = 10;
  const orderTotal = cartTotal + shipping;
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="min-h-screen bg-[#F8F7FF]">
      {/* Purple header */}
      <div
        className="pt-[62px] pb-5 px-4"
        style={{ background: "linear-gradient(180deg, #7C3AED 0%, #6D28D9 100%)" }}
      >
        <div className="max-w-3xl mx-auto flex items-center justify-between pt-4">
          <div className="flex items-center gap-3">
            <Link href="/products" className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-white text-xl font-bold">My Cart</h1>
          </div>
          {itemCount > 0 && (
            <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </span>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pb-32 pt-4">
        {items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24"
          >
            <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.5">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
            </div>
            <p className="text-gray-400 text-sm mb-6">Your cart is empty.</p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#7C3AED] text-white text-sm font-semibold rounded-full hover:bg-[#6D28D9] transition-colors"
            >
              Continue Shopping
            </Link>
          </motion.div>
        ) : (
          <>
            {/* Items */}
            <div className="space-y-3 mb-4">
              <AnimatePresence>
                {items.map((item) => {
                  const image = item.images?.[0] ?? "/placeholder.jpg";
                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -40, height: 0, marginBottom: 0 }}
                      transition={{ duration: 0.35 }}
                      className="bg-white rounded-2xl p-3 shadow-sm flex gap-3"
                    >
                      <Link href={`/products/${item.id}`} className="relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-purple-50">
                        <Image src={image} alt={item.name} fill sizes="80px" className="object-cover" />
                      </Link>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div>
                            <p className="text-[11px] text-gray-400 uppercase tracking-wide">{item.category}</p>
                            <Link href={`/products/${item.id}`} className="text-sm font-semibold text-gray-800 line-clamp-1 hover:text-[#7C3AED] transition-colors">
                              {item.name}
                            </Link>
                            <p className="text-[11px] text-gray-400 mt-0.5">Color: Default</p>
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-gray-300 hover:text-red-400 transition-colors cursor-pointer flex-shrink-0 mt-0.5"
                            aria-label="Remove item"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                          </button>
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          <p className="text-[#7C3AED] font-bold text-sm">
                            ₦{(item.price * item.quantity).toLocaleString()}
                          </p>

                          {/* Quantity controls */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="w-7 h-7 rounded-full border-2 border-[#7C3AED] flex items-center justify-center text-[#7C3AED] hover:bg-[#7C3AED] hover:text-white transition-colors cursor-pointer"
                              aria-label="Decrease quantity"
                            >
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <path d="M5 12h14" />
                              </svg>
                            </button>
                            <span className="text-sm font-semibold text-gray-700 w-5 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-7 h-7 rounded-full bg-[#7C3AED] flex items-center justify-center text-white hover:bg-[#6D28D9] transition-colors cursor-pointer"
                              aria-label="Increase quantity"
                            >
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <path d="M12 5v14M5 12h14" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              <button
                onClick={clearCart}
                className="text-xs text-gray-400 hover:text-red-400 transition-colors cursor-pointer ml-1 mt-1"
              >
                Clear all items
              </button>
            </div>

            {/* Order Summary */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-5 shadow-sm"
            >
              <h2 className="text-base font-bold text-gray-800 mb-4">Order Summary</h2>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="text-gray-700 font-medium">₦{cartTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Delivery Fee</span>
                  <span className="text-gray-700 font-medium">₦{shipping.toLocaleString()}</span>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3 mb-5 flex justify-between items-center">
                <span className="text-base font-bold text-gray-800">Total</span>
                <span className="text-lg font-bold text-[#7C3AED]">₦{orderTotal.toLocaleString()}</span>
              </div>

              <button className="w-full py-4 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-sm font-bold tracking-wide rounded-2xl transition-colors cursor-pointer mb-3">
                Proceed to Checkout
              </button>

              <Link
                href="/products"
                className="block w-full py-3 text-center text-sm text-gray-400 hover:text-[#7C3AED] transition-colors"
              >
                Continue Shopping
              </Link>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
