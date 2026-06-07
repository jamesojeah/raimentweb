"use client";
import { useCursorContext } from "@/context/CursorContext";

export function useCursor() {
  const { setVariant } = useCursorContext();

  const onHover = (label = "VIEW") => () => setVariant("hover", label);
  const onProduct = () => setVariant("product");
  const onLeave = () => setVariant("default");

  return { onHover, onProduct, onLeave };
}
