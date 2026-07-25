"use client";

import { useEffect, useState } from "react";
import { SECTIONS } from "./lib/sections.js";

// Sticky table of contents with scroll-spy: the section nearest the top of the
// viewport is marked current. Pure enhancement; the links work without JS.
export function Toc(): JSX.Element {
  const [active, setActive] = useState<string>(SECTIONS[0]?.id ?? "");

  useEffect(() => {
    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    if (els.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]?.target.id) {
          setActive(visible[0].target.id);
        }
      },
      { rootMargin: "-12% 0px -70% 0px", threshold: 0 },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <nav className="toc" aria-label="Contents">
      <p className="toc__title">On this page</p>
      <ul className="toc__list">
        {SECTIONS.map((s) => (
          <li key={s.id}>
            <a
              className="toc__link"
              href={`#${s.id}`}
              aria-current={active === s.id ? "true" : undefined}
            >
              {s.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
