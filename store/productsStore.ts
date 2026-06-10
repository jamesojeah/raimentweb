"use client";
import { create } from "zustand";
import { fetchProducts } from "@/lib/firestore";
import type { Product } from "@/types/product";

interface ProductsState {
  products: Product[];
  loading: boolean;
  error: string | null;
  hasFetched: boolean;
  loadProducts: () => Promise<void>;
}

export const useProductsStore = create<ProductsState>((set, get) => ({
  products: [],
  loading: false,
  error: null,
  hasFetched: false,
  loadProducts: async () => {
    if (get().hasFetched || get().loading) return;
    set({ loading: true, error: null });
    try {
      const products = await fetchProducts();
      set({ products, hasFetched: true });
    } catch (e) {
      set({ error: (e as Error).message });
    } finally {
      set({ loading: false });
    }
  },
}));
