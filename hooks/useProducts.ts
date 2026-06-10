"use client";
import { useEffect } from "react";
import { useProductsStore } from "@/store/productsStore";

export function useProducts() {
  const { products, loading, error, loadProducts } = useProductsStore();

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  return { products, loading, error };
}
