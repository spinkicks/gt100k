"use client";

// `OrderingWhy` and `OrderingBasisTag`, the citation affordance for a milestone's ordering.
//
// THIS IS NOT A DUPLICATE OF `WhyThis`, and it is worth saying so before anyone deletes one of them.
// `why.tsx` takes an `id: string` and looks the claim up in the static `@gt100k/research` registry,
// which works because every claim it annotates is one of a fixed set the product makes about itself.
// An ordering justification is not in any registry: it is per-milestone data, authored with the map,
// and there is nothing to look up. `BasisTag` in `basis.tsx` renders research's three-valued `Basis`
// (evidence, chosen, policy); an `OrderingBasis` has four values and the fourth, `model`, is the one
// the whole ordering rule exists to expose. So this takes its `Justification` as a prop and renders
// four grounds rather than three.
//
// What it deliberately DOES share is the visual language: the same quiet trigger, the same popover
// shape, the same honest-limit line, and the same "no published source" fallback, all of it on
// `why.tsx`'s own classes so the two cannot drift apart visually. A guide should not have to learn a
// second convention because the data came from somewhere else.
import { useCallback, useEffect, useId, useRef, useState, type JSX } from "react";
import type { Justification, OrderingBasis } from "@gt100k/mastery-map";

import { SUPPORT_NOTE, SUPPORT_TEXT } from "./maps.js";

/**
 * The four grounds, told apart by their words first and their ground second, exactly as `BasisTag`
 * is. `model` reads as the weakest of the four on purpose: it is the one nobody outside us has
 * checked, and a map that hid that would be the failure the ordering rule was written to catch.
 */
export function OrderingBasisTag({ basis }: { basis: OrderingBasis }): JSX.Element {
  return <span className={`why-tag ob-tag ob-tag--${basis}`}>{SUPPORT_TEXT[basis]}</span>;
}

export function OrderingWhy({ ordering }: { ordering: Justification }): JSX.Element {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const headingId = useId();

  const close = useCallback((refocus: boolean): void => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  }, []);

  // Escape and outside-click, bound only while open so a closed popover costs nothing.
  useEffect(() => {
    if (!open) return undefined;
    function onKeyDown(e: KeyboardEvent): void {
      if (e.key === "Escape") close(true);
    }
    function onPointerDown(e: MouseEvent): void {
      if (!wrapRef.current?.contains(e.target as Node)) close(false);
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open, close]);

  return (
    <div className="ordering">
      <div className="ordering__hd">
        <span className="ordering__k">Why here</span>
        <OrderingBasisTag basis={ordering.basis} />

        {/* No flip logic, unlike why.tsx. That trigger is dropped into table headers and stat tiles
            near the viewport edge; this one always sits at the left of a full-width card, so below
            and to the right is the only placement it ever needs. */}
        <span
          className="why"
          ref={wrapRef}
          onBlur={(e) => {
            if (open && !e.currentTarget.contains(e.relatedTarget)) setOpen(false);
          }}
        >
          <button
            ref={triggerRef}
            type="button"
            className="why-btn"
            aria-expanded={open}
            aria-controls={open ? panelId : undefined}
            aria-label="What this ordering rests on"
            onClick={() => setOpen(!open)}
          >
            <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true" focusable="false">
              <circle cx="8" cy="8" r="6.6" fill="none" stroke="currentColor" strokeWidth="1.3" />
              <circle cx="8" cy="4.9" r="0.95" fill="currentColor" />
              <path d="M8 7.3v4.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>

          {open ? (
            <span
              /* biome-ignore lint/a11y/useSemanticElements: same reason as why.tsx, this popover is
                 phrasing content and a block-level <fieldset> would be invalid here. */
              id={panelId}
              role="group"
              aria-labelledby={headingId}
              className="why-pop"
            >
              <span className="why-pop__hd">
                <span className="why-pop__k" id={headingId}>
                  What this rests on
                </span>
                <OrderingBasisTag basis={ordering.basis} />
              </span>

              <span className="why-pop__why">{SUPPORT_NOTE[ordering.basis]}</span>

              {ordering.limit !== undefined ? (
                <span className="why-pop__limit">
                  <b>Honest limit:</b> {ordering.limit}
                </span>
              ) : null}

              {ordering.sources.length > 0 ? (
                <span className="why-pop__src">
                  <span className="why-pop__srck">
                    {ordering.sources.length === 1 ? "Source" : "Sources"}
                  </span>
                  {ordering.sources.map((s) => (
                    <a
                      key={s.url}
                      className="why-src"
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {s.authors} ({s.year})<span className="ov-sr"> (opens in a new tab)</span>
                    </a>
                  ))}
                </span>
              ) : (
                <span className="why-pop__nosrc">
                  No published source: this is a default we picked, not a finding.
                </span>
              )}
            </span>
          ) : null}
        </span>
      </div>

      {/* The reason itself stays in the open. The popover holds what it rests on and what that is
          worth; the sentence explaining the placement is the thing a guide is here to read. */}
      <p className="ordering__reason">{ordering.reason}</p>
    </div>
  );
}
