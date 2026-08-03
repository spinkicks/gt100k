"use client";

// The one line a guide reads first: what this child needs right now, and the single button that
// does it. Everything below the line is here only if they choose to investigate -- the verdict is
// the same one the roster shows (attention.ts), so the switcher and this line never disagree.
import type { JSX } from "react";
import type { Attention } from "./attention.js";
import type { ConsoleController } from "./useConsole.js";

const WORD: Record<Attention["level"], string> = {
  NEEDS_YOU: "Needs you",
  READY: "Ready",
  STEADY: "Steady",
};

export function ActionLine({
  ctrl,
  onReviewFamily,
}: {
  ctrl: ConsoleController;
  // Opens the Family & coaching tab. A family-pressure verdict names no specialization, so its
  // caution has no card to open; this is the one action that resolves it -- go and read the flag.
  onReviewFamily?: () => void;
}): JSX.Element {
  const a = ctrl.attention;
  const level = a.level.toLowerCase();
  // Promote is offered only when the gate has genuinely passed AND the store agrees there is a
  // promotable card, so the button never fires an action the engine would refuse. Otherwise, if the
  // verdict names a specialization, we offer to open it; a bare Steady line carries no button.
  const canPromote = a.reason === "GATE_READY" && ctrl.promotableId !== null;
  return (
    <section className={`actionline actionline--${level}`} aria-label="What to do next">
      <span className={`actionline__dot actionline__dot--${level}`} aria-hidden="true" />
      <span className="actionline__word">{WORD[a.level]}</span>
      <span className="actionline__headline">{a.headline}</span>
      {canPromote ? (
        <button type="button" className="actionline__do" onClick={ctrl.advanceTop}>
          Promote
        </button>
      ) : a.reason === "FAMILY_PRESSURE" && onReviewFamily ? (
        // The caution's own resolution: the flag lives in the Family tab, so send the guide there
        // rather than to a specialization the pressure read never named.
        <button
          type="button"
          className="actionline__do actionline__do--review"
          onClick={onReviewFamily}
        >
          Review family
        </button>
      ) : a.specId !== null ? (
        <button
          type="button"
          className="actionline__do actionline__do--review"
          onClick={() => ctrl.setSelectedId(a.specId)}
        >
          Review
        </button>
      ) : null}
    </section>
  );
}
