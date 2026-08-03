"use client";

// The confirmation a consequential action leaves behind. Promote, park, contest and reopen all
// change a child's record, and until now they did it silently: the row simply changed and a guide
// mid-roster could not tell their click had landed, nor take it back if it was a slip. This says what
// just happened, to whom, and offers the one thing a silent commit denies -- undo. It reads as a
// calm acknowledgement, not an alarm: the act was legitimate, this is only its receipt.
//
// Rendered once, above both modes, so wherever the guide acted (a roster row or a detail-pane
// button) the same receipt appears in the same place. `role="status"` announces it to assistive tech
// without stealing focus, because feedback a sighted user gets for free should not be the one thing a
// screen-reader user has to go hunting for.
import type { JSX } from "react";
import type { ConsoleController } from "./useConsole.js";

export function PromoteFlash({ ctrl }: { ctrl: ConsoleController }): JSX.Element | null {
  const a = ctrl.lastAction;
  if (!a) return null;
  return (
    <div className="flash" role="status">
      <span className="flash__msg">
        {a.verb} <strong>{a.label}</strong> for {a.child}.
      </span>
      <div className="flash__acts">
        <button type="button" className="flash__undo" onClick={ctrl.undoLast}>
          Undo
        </button>
        <button
          type="button"
          className="flash__dismiss"
          onClick={ctrl.clearLastAction}
          aria-label="Dismiss this confirmation"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
