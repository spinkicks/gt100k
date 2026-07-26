"use client";

import { useEffect, useState } from "react";
import { SECTIONS } from "./lib/sections.js";

// Sticky table of contents with scroll-spy: the section nearest the top of the viewport is
// marked current. On narrow screens it collapses to a disclosure so the article is reachable
// immediately; on wide screens it is always open and the toggle is hidden. Links work without JS.
export function Toc(): JSX.Element {
  const [active, setActive] = useState<string>(SECTIONS[0]?.id ?? "");
  const [open, setOpen] = useState<boolean>(true);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 861px)");
    const sync = () => setOpen(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

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
    for (const el of els) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <details
      className="toc"
      open={open}
      onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}
    >
      <summary className="toc__summary">
        <span className="toc__title">On this page</span>
        <span className="toc__chevron" aria-hidden="true" />
      </summary>
      <nav aria-label="Contents">
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
    </details>
  );
}
