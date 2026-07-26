"use client";

// `WhyThis` — the citation affordance, placed at the point of the claim.
//
// A guide is not a researcher. Without a stated reason a number like "74% confidence" is an oracle,
// and the practitioner literature is blunt about what people do with oracles: they invent folk
// theories. So every number on the Overview can be asked "why?", and the answer is one plain
// sentence, what it rests on, the honest limit, and a link to the source.
//
// It is deliberately a secondary affordance. The metric stays the loudest thing on the tile; the
// reason is one quiet step behind it, and the screen is never harder to understand for people who
// never open it. The popover is anchored below the trigger so it cannot cover the number it
// annotates, and flips left or above when the trigger sits near a viewport edge.
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type JSX,
} from "react";
import { claim } from "@gt100k/research";

import { BasisTag } from "./basis.js";

/** Matches `.why-pop` in globals.css; a rough height is enough to decide which way to open. */
const POP_WIDTH = 320;
const POP_HEIGHT_ESTIMATE = 260;
const EDGE_PAD = 12;
/** The `left: -6px` in `.why-pop`: the popover's left edge sits this far left of the trigger's. */
const POP_INSET = 6;

interface Placement {
  /** Open leftward: the trigger is too close to the right edge to open the usual way. */
  readonly x: boolean;
  /** Open upward: not enough room below, and more room above. */
  readonly y: boolean;
  /** Extra downward offset, in px, that clears the block the annotated number sits in. */
  readonly clear: number;
  /** Extra rightward offset, in px, that steps out of the column the trigger heads. */
  readonly shift: number;
}

const BELOW_RIGHT: Placement = { x: false, y: false, clear: 0, shift: 0 };

/**
 * Which way the popover should open, decided from the trigger's position when it is clicked.
 *
 * A popover sitting on top of the very figure it explains is worse than no popover, so the two
 * offsets below exist purely to get out of the number's way: `shift` steps a column header's
 * popover sideways out of its own column, and `clear` drops a flipped tile popover past its tile.
 */
function placementFor(trigger: HTMLElement | null): Placement {
  if (trigger === null || typeof window === "undefined") return BELOW_RIGHT;
  const r = trigger.getBoundingClientRect();

  const column = trigger.closest("th");
  const shift =
    column === null
      ? 0
      : Math.max(0, column.getBoundingClientRect().right - (r.left - POP_INSET));

  const x = r.left - POP_INSET + shift + POP_WIDTH + EDGE_PAD > window.innerWidth;
  const y =
    !x &&
    r.bottom + POP_HEIGHT_ESTIMATE + EDGE_PAD > window.innerHeight &&
    r.top > POP_HEIGHT_ESTIMATE + EDGE_PAD;

  // Below-right clears the number on its own, because a number sits to the LEFT of its trigger.
  // Leftward does not, so on a stat tile the popover drops below the whole tile instead.
  const block = x ? trigger.closest(".tile") : null;
  const clear = block === null ? 0 : Math.max(0, block.getBoundingClientRect().bottom - r.bottom);

  return { x, y, clear, shift: x ? 0 : shift };
}

function lowerFirst(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

export function WhyThis({
  id,
  /** Overrides the noun in the button's label, for claims whose title does not read as one. */
  what,
}: {
  id: string;
  what?: string;
}): JSX.Element | null {
  const found = claim(id);
  const [open, setOpen] = useState(false);
  const [at, setAt] = useState<Placement>(BELOW_RIGHT);
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

  // An id with no registry entry renders nothing at all: a missing citation must never take a
  // screen down, and a broken info button is worse than no info button.
  if (found === undefined) return null;

  return (
    <span
      className="why"
      ref={wrapRef}
      // Tabbing past the last link closes it. Focus is never held inside, so the popover can always
      // be tabbed straight through.
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
        aria-label={`Why we measure ${what ?? lowerFirst(found.label)}`}
        onClick={() => {
          if (!open) setAt(placementFor(triggerRef.current));
          setOpen(!open);
        }}
      >
        <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true" focusable="false">
          <circle cx="8" cy="8" r="6.6" fill="none" stroke="currentColor" strokeWidth="1.3" />
          <circle cx="8" cy="4.9" r="0.95" fill="currentColor" />
          <path d="M8 7.3v4.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </button>

      {open ? (
        <span
          /* biome-ignore lint/a11y/useSemanticElements: this popover is phrasing content inside a
             paragraph, where a block-level <fieldset> is invalid and would add a UA groove border. */
          id={panelId}
          role="group"
          aria-labelledby={headingId}
          className={`why-pop${at.x ? " why-pop--left" : ""}${at.y ? " why-pop--up" : ""}`}
          style={
            { "--why-clear": `${at.clear}px`, "--why-shift": `${at.shift}px` } as CSSProperties
          }
        >
          <span className="why-pop__hd">
            <span className="why-pop__k" id={headingId}>
              {found.label}
            </span>
            <BasisTag basis={found.basis} />
          </span>

          <span className="why-pop__why">{found.why}</span>

          {found.limit !== undefined ? (
            <span className="why-pop__limit">
              <b>Honest limit:</b> {found.limit}
            </span>
          ) : null}

          {found.sources.length > 0 ? (
            <span className="why-pop__src">
              <span className="why-pop__srck">
                {found.sources.length === 1 ? "Source" : "Sources"}
              </span>
              {found.sources.map((s) => (
                <a
                  key={s.url}
                  className="why-src"
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {s.authors} ({s.year})<span className="ov-sr"> — opens in a new tab</span>
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
  );
}
