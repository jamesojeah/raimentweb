"use client";
import { create } from "zustand";
import type { CompletedOrder } from "@/types/payment";

interface OrderState {
  lastOrder: CompletedOrder | null;
  setLastOrder: (order: CompletedOrder) => void;
  clearLastOrder: () => void;
}

export const useOrderStore = create<OrderState>((set) => ({
  lastOrder: null,
  setLastOrder: (order) => set({ lastOrder: order }),
  clearLastOrder: () => set({ lastOrder: null }),
}));
