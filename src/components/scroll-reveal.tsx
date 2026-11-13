"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

export default function ScrollReveal({ children, className, delay = 0 }: ScrollRevealProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
    const element = elementRef.current;
    if (!element || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const shouldAnimate = isMounted && !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  return (
    <div
      ref={elementRef}
      className={className}
      data-scroll-reveal="true"
      data-scroll-reveal-visible={isVisible || !shouldAnimate ? "true" : "false"}
      style={{ "--scroll-reveal-delay": `${delay}s` } as CSSProperties}
    >
      {children}
    </div>
  );
}
