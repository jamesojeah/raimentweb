"use client";
import { useCartStore } from "@/store/cartStore";

export function useCart() {
  const { items, addItem, removeItem, updateQuantity, clearCart, total, itemCount } =
    useCartStore();

  return { items, addItem, removeItem, updateQuantity, clearCart, total, itemCount };
}
