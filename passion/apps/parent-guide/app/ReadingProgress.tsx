"use client";

import { useEffect, useRef } from "react";

// A slim top rail showing how far down the page the reader is. Decorative-adjacent
// but conveys real state (scroll position), and it is hidden for reduced motion via CSS.
export function ReadingProgress(): JSX.Element {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const p = max > 0 ? Math.min(1, doc.scrollTop / max) : 0;
      ref.current?.style.setProperty("--p", String(p));
    };
    const onScroll = () => {
      if (frame === 0) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return <div ref={ref} className="progress" aria-hidden="true" />;
}
