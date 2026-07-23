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

function ringSub(state: string, n: number): string {
  switch (state) {
    case "ACTIVE":
      return "active";
    case "CANDIDATE":
      return "ready to activate";
    case "EMERGING":
      return `${n}/${GATE_CHECKS.length} to promote`;
    case "EXPLORING":
      return "gathering signal";
    default:
      return stateTerm(state).label.toLowerCase();
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
  const frac =
    state === "ACTIVE" || state === "CANDIDATE"
      ? 1
      : state === "EMERGING"
        ? n / GATE_CHECKS.length
        : 0;
  const r = 26;
  const c = 2 * Math.PI * r;
  const dash = c * frac;
  return (
    <div className="pv-ring" role="img" aria-label={`${stateTerm(state).label}, ${ringSub(state, n)}`}>
      <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
        <circle cx="32" cy="32" r={r} fill="none" stroke="var(--line-2)" strokeWidth="5" />
        {frac > 0 && (
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
      <div className="pv-ring__c">
        <span className="pv-ring__stage">{stateTerm(state).label}</span>
        <span className="pv-ring__sub">{ringSub(state, n)}</span>
      </div>
    </div>
  );
}
