"use client";
import React, { createContext, useContext, useState, useCallback } from "react";

type CursorVariant = "default" | "hover" | "product" | "hidden";

interface CursorCtx {
  variant: CursorVariant;
  label: string;
  setVariant: (v: CursorVariant, label?: string) => void;
}

const CursorContext = createContext<CursorCtx>({
  variant: "default",
  label: "",
  setVariant: () => {},
});

export function CursorProvider({ children }: { children: React.ReactNode }) {
  const [variant, setVariantState] = useState<CursorVariant>("default");
  const [label, setLabel] = useState("");

  const setVariant = useCallback((v: CursorVariant, lbl = "") => {
    setVariantState(v);
    setLabel(lbl);
  }, []);

  return (
    <CursorContext.Provider value={{ variant, label, setVariant }}>
      {children}
    </CursorContext.Provider>
  );
}

export const useCursorContext = () => useContext(CursorContext);
