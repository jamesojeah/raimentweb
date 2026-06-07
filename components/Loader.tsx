"use client";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

interface LoaderProps {
  onComplete: () => void;
}

export default function Loader({ onComplete }: LoaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lettersRef = useRef<HTMLSpanElement[]>([]);
  const curtainRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!visible) return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      onComplete();
      setVisible(false);
      return;
    }

    const tl = gsap.timeline({
      onComplete: () => {
        setVisible(false);
        onComplete();
      },
    });

    tl.set(lettersRef.current, {
      opacity: 0,
      rotateX: -90,
      y: 40,
      transformStyle: "preserve-3d",
    })
      .to(lettersRef.current, {
        opacity: 1,
        rotateX: 0,
        y: 0,
        duration: 0.7,
        stagger: 0.06,
        ease: "back.out(1.7)",
      })
      .to({}, { duration: 0.5 })
      .to(lettersRef.current, {
        opacity: 0,
        y: -30,
        stagger: 0.04,
        duration: 0.4,
        ease: "power2.in",
      })
      .to(
        curtainRef.current,
        {
          scaleY: 0,
          transformOrigin: "top",
          duration: 0.8,
          ease: "power4.inOut",
        },
        "-=0.2"
      );
  }, []);

  if (!visible) return null;

  const letters = "RAIMENT".split("");

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[10000] flex items-center justify-center"
      style={{ perspective: "800px", background: "linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)" }}
    >
      <div className="flex items-center gap-1" style={{ transformStyle: "preserve-3d" }}>
        {letters.map((l, i) => (
          <span
            key={i}
            ref={(el) => {
              if (el) lettersRef.current[i] = el;
            }}
            className="text-[clamp(3rem,10vw,8rem)] font-serif font-bold tracking-[0.2em] text-white"
            style={{ display: "inline-block", transformStyle: "preserve-3d" }}
          >
            {l}
          </span>
        ))}
      </div>

      {/* Curtain overlay that wipes up on exit */}
      <div
        ref={curtainRef}
        className="absolute inset-0 origin-bottom"
        style={{ background: "linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)" }}
      />
    </div>
  );
}
