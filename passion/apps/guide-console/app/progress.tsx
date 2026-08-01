// The chosen progress/level visual: a compact ring gauge of progress toward the next promotion, with
// the lifecycle stage shown as the "level". Pure + presentational, driven by the lifecycle stage and
// the three graduation-gate checks (clearing all three makes an Emerging interest ready to promote).
import type { JSX } from "react";
import { stateTerm } from "./vocab.js";

export interface GateLike {
  readonly gapSurvived?: boolean;
  readonly durable?: boolean;
  readonly hasArtifact?: boolean;
  readonly passed?: boolean;
}

export const PIPELINE = ["EXPLORING", "EMERGING", "CANDIDATE", "ACTIVE"] as const;

export const GATE_CHECKS: readonly (keyof GateLike)[] = ["gapSurvived", "durable", "hasArtifact"];

export function gateCount(gate: GateLike | undefined): number {
  if (!gate) return 0;
  return GATE_CHECKS.filter((k) => gate[k]).length;
}

/**
 * The line under the stage name, or empty where there is nothing to add.
 *
 * `ACTIVE` and the default branch used to return the stage word again, so a card read "Active" over
 * "active" and "Parked" over "parked" — the same word twice, in two sizes, one capitalised. An empty
 * string here means the caller omits the line rather than printing an echo.
 */
function ringSub(state: string, n: number): string {
  switch (state) {
    case "CANDIDATE":
      return "ready to activate";
    case "EMERGING":
      return `${n}/${GATE_CHECKS.length} to promote`;
    case "EXPLORING":
      return "gathering signal";
    default:
      return "";
  }
}

export function ProgressRing({
  state,
  gate,
  size = 64,
}: {
  state: string;
  gate?: GateLike;
  size?: number;
}): JSX.Element {
  const n = gateCount(gate);
  const sub = ringSub(state, n);
  /**
   * THE RING IS DRAWN FOR `EMERGING` ONLY, because that is the only state where it carries something
   * the word beside it does not: how many of the three gate checks are cleared.
   *
   * It used to fill completely for `ACTIVE` and `CANDIDATE` alike. A full circle is the universal
   * mark for finished, and a Candidate is a proposal awaiting a guide's sign-off — so the console
   * was drawing a completed gauge over the word "ready to activate". On a product that refuses to
   * reduce a child to a score, a ring reading 100% against their specialization is the closest thing
   * on screen to the shape that was banned. For every other state it drew a full or an empty circle,
   * both of which are decoration.
   */
  const showRing = state === "EMERGING";
  const r = 26;
  const c = 2 * Math.PI * r;
  const dash = c * (n / GATE_CHECKS.length);
  return (
    <div
      className="pv-ring"
      role="img"
      aria-label={sub === "" ? stateTerm(state).label : `${stateTerm(state).label}, ${sub}`}
    >
      {showRing ? (
        <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
          <circle cx="32" cy="32" r={r} fill="none" stroke="var(--line-2)" strokeWidth="5" />
          {dash > 0 && (
            <circle
              cx="32"
              cy="32"
              r={r}
              fill="none"
              stroke="var(--ink)"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${c - dash}`}
              transform="rotate(-90 32 32)"
            />
          )}
        </svg>
      ) : null}
      <div className="pv-ring__c">
        <span className="pv-ring__stage">{stateTerm(state).label}</span>
        {sub === "" ? null : <span className="pv-ring__sub">{sub}</span>}
      </div>
    </div>
  );
}
