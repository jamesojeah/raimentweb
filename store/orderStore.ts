"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CompletedOrder } from "@/types/payment";

interface OrderState {
  lastOrder: CompletedOrder | null;
  setLastOrder: (order: CompletedOrder) => void;
  clearLastOrder: () => void;
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set) => ({
      lastOrder: null,
      setLastOrder: (order) => set({ lastOrder: order }),
      clearLastOrder: () => set({ lastOrder: null }),
    }),
    { name: "raiment-last-order" }
  )
);
