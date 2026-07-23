// Lifecycle states + transition-legality table + golden constants (spec §3.1, §3.4).

export const LIFECYCLE = [
  "EXPLORING",
  "EMERGING",
  "CANDIDATE",
  "ACTIVE",
  "PARKED",
  "CONTESTED",
  "REOPENED",
] as const;
export type Lifecycle = (typeof LIFECYCLE)[number];
export type TransitionKind = "auto" | "human";

// Golden constants — spec §3.4. Do not change without changing the spec.
export const GAP_DAYS = 14;
export const MIN_TERM_DAYS = 56;
export const MIN_REVIEW_CYCLES = 2;
export const SPIKE_THRESHOLD = 0.6;

// Allowed transitions. `auto` = system (applyInterestRead); `human` = a named human actor.
const AUTO: ReadonlyArray<readonly [Lifecycle, Lifecycle]> = [
  ["EXPLORING", "EMERGING"],
  ["EMERGING", "CONTESTED"],
  ["CANDIDATE", "CONTESTED"],
];
const HUMAN: ReadonlyArray<readonly [Lifecycle, Lifecycle]> = [
  ["EMERGING", "CANDIDATE"],
  ["CANDIDATE", "ACTIVE"],
  ["EMERGING", "PARKED"],
  ["CANDIDATE", "PARKED"],
  ["ACTIVE", "PARKED"],
  ["CONTESTED", "PARKED"],
  ["EXPLORING", "PARKED"],
  ["REOPENED", "PARKED"],
  ["PARKED", "REOPENED"],
  ["REOPENED", "EMERGING"],
  ["CONTESTED", "EMERGING"],
];

export function canTransition(from: Lifecycle, to: Lifecycle, by: TransitionKind): boolean {
  // Humans may also perform the auto transitions; the system may only do the auto ones.
  const table = by === "auto" ? AUTO : [...AUTO, ...HUMAN];
  return table.some(([f, t]) => f === from && t === to);
}
