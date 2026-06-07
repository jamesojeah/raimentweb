"use client";
import { useEffect, useRef, useState } from "react";
import { useCursorContext } from "@/context/CursorContext";

export default function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0 });
  const ring = useRef({ x: 0, y: 0 });
  const raf = useRef<number>(0);
  const { variant, label } = useCursorContext();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  useEffect(() => {
    if (isMobile) return;

    const onMove = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", onMove);

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const tick = () => {
      ring.current.x = lerp(ring.current.x, pos.current.x, 0.12);
      ring.current.y = lerp(ring.current.y, pos.current.y, 0.12);

      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px) translate(-50%, -50%)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ring.current.x}px, ${ring.current.y}px) translate(-50%, -50%)`;
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf.current);
    };
  }, [isMobile]);

  if (isMobile) return null;

  const isHover = variant === "hover";
  const isProduct = variant === "product";

  return (
    <>
      {/* Dot */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 pointer-events-none z-[9999] rounded-full bg-[#7C3AED] transition-[width,height,opacity] duration-200"
        style={{
          width: isHover || isProduct ? "0px" : "12px",
          height: isHover || isProduct ? "0px" : "12px",
          opacity: variant === "hidden" ? 0 : 1,
          willChange: "transform",
        }}
      />

      {/* Ring */}
      <div
        ref={ringRef}
        className="fixed top-0 left-0 pointer-events-none z-[9998] rounded-full border border-[#7C3AED] flex items-center justify-center transition-[width,height,background,border-color] duration-300"
        style={{
          width: isHover ? "80px" : isProduct ? "60px" : "40px",
          height: isHover ? "80px" : isProduct ? "60px" : "40px",
          background: isHover ? "rgba(124,58,237,0.12)" : "transparent",
          willChange: "transform",
        }}
      >
        {isHover && label && (
          <span className="text-[10px] font-semibold tracking-[0.15em] text-[#7C3AED] uppercase">
            {label}
          </span>
        )}
        {isProduct && (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.5">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
            <path d="M11 8v6M8 11h6" />
          </svg>
        )}
      </div>
    </>
  );
}
