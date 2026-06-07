"use client";
import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface SplitTextProps {
  text: string;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
  delay?: number;
}

export default function SplitText({ text, className = "", as: Tag = "h2", delay = 0 }: SplitTextProps) {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const spans = el.querySelectorAll<HTMLSpanElement>(".char");

    gsap.fromTo(
      spans,
      { opacity: 0, y: 60, rotateX: -40, transformOrigin: "0% 50%" },
      {
        opacity: 1,
        y: 0,
        rotateX: 0,
        duration: 0.8,
        stagger: 0.025,
        delay,
        ease: "power3.out",
        scrollTrigger: {
          trigger: el,
          start: "top 85%",
          toggleActions: "play none none none",
        },
      }
    );
  }, [delay]);

  const chars = text.split("").map((ch, i) => (
    <span key={i} className="char inline-block" style={{ display: ch === " " ? "inline" : "inline-block" }}>
      {ch === " " ? " " : ch}
    </span>
  ));

  return (
    // @ts-expect-error dynamic tag
    <Tag ref={containerRef} className={className} style={{ perspective: "600px", overflow: "hidden" }}>
      {chars}
    </Tag>
  );
}
