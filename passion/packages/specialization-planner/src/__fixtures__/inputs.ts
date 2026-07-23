// Synthetic PlanInputs fixtures — one bundle per stage (S1…S4) plus the readiness-not-age (SC-2),
// strain (SC-7), and plurality (SC-9) cases. SYNTHETIC ONLY; no live/child data. Reused by the
// stage, plan, and guardrail tests so the golden values live in exactly one place.
import type { DomainPath } from "@gt100k/two-axis-tagging";
import type { WellbeingRead } from "@gt100k/wellbeing";
import type { PlanInputs } from "../model.js";

const NOW = "2026-07-23T00:00:00.000Z";

/** A calm, in-zone wellbeing read — no strain, no back-off, no rest (the default). */
export function calmWellbeing(kidId: string, cellKey: string): WellbeingRead {
  return {
    kidId,
    cellKey,
    state: "IN_ZONE",
    challenge: "HOLD",
    pressure: "STEADY",
    backOff: false,
    rest: false,
    reduceEvaluativeSurfacing: false,
    escalateToHuman: false,
    rationale: "in the stretch zone; steady",
    guardrailNotes: [],
  };
}

/** A strained wellbeing read — rest + back-off (the counter-cyclical hold case, SC-7). */
export function strainWellbeing(kidId: string, cellKey: string): WellbeingRead {
  return {
    kidId,
    cellKey,
    state: "BURNOUT_TIP",
    challenge: "SCAFFOLD",
    pressure: "AUTONOMY_UP",
    backOff: true,
    rest: true,
    reduceEvaluativeSurfacing: true,
    escalateToHuman: true,
    escalationReason: "obsessive-tip signals",
    rationale: "protect the rage to master; propose a guilt-free rest",
    guardrailNotes: ["weight devaluation over exhaustion"],
  };
}

interface MakeArgs {
  readonly kidId?: string;
  readonly domainPath?: DomainPath;
  readonly mode?: string;
  readonly hypothesisState?: string;
  readonly monthsInPursuit?: number;
  readonly voluntaryReturnsRecent: number;
  readonly depthAccumulation: number;
  readonly stretchSeeking: boolean;
  readonly producerIdentity: boolean;
  readonly wellbeing?: WellbeingRead;
}

/** Build a PlanInputs bundle, defaulting the music-sound/production cell + a calm wellbeing read. */
export function makeInputs(args: MakeArgs): PlanInputs {
  const kidId = args.kidId ?? "kid-synthetic-001";
  const domainPath = args.domainPath ?? (["music-sound", "production"] as const);
  const mode = args.mode ?? "build";
  const cellKey = `${domainPath.length === 2 ? `${domainPath[0]}/${domainPath[1]}` : domainPath[0]}::${mode}`;
  return {
    kidId,
    cellKey,
    domainPath,
    mode,
    hypothesisState: args.hypothesisState ?? "ACTIVE",
    monthsInPursuit: args.monthsInPursuit ?? 6,
    voluntaryReturnsRecent: args.voluntaryReturnsRecent,
    depthAccumulation: args.depthAccumulation,
    stretchSeeking: args.stretchSeeking,
    producerIdentity: args.producerIdentity,
    wellbeing: args.wellbeing ?? calmWellbeing(kidId, cellKey),
    now: NOW,
  };
}

// ── One bundle per stage (readiness signals only; monthsInPursuit is indicative) ─────────────
/** Fresh ACTIVE spike, low readiness ⇒ S1_IGNITION (the entry stage). */
export const INPUTS_S1: PlanInputs = makeInputs({
  monthsInPursuit: 2,
  voluntaryReturnsRecent: 2,
  depthAccumulation: 1,
  stretchSeeking: false,
  producerIdentity: false,
});

/** Craft floor + sustained return, not yet stretch-seeking ⇒ S2_FOUNDATIONS. */
export const INPUTS_S2: PlanInputs = makeInputs({
  monthsInPursuit: 9,
  voluntaryReturnsRecent: 5,
  depthAccumulation: 4,
  stretchSeeking: false,
  producerIdentity: false,
});

/** Stretch-seeking + deeper craft floor ⇒ S3_AUTHORSHIP (not producer-identity yet). */
export const INPUTS_S3: PlanInputs = makeInputs({
  monthsInPursuit: 18,
  voluntaryReturnsRecent: 9,
  depthAccumulation: 10,
  stretchSeeking: true,
  producerIdentity: false,
});

/** Producer identity + stretch + high craft floor + sustained return ⇒ S4_SIGNATURE. */
export const INPUTS_S4: PlanInputs = makeInputs({
  monthsInPursuit: 30,
  voluntaryReturnsRecent: 13,
  depthAccumulation: 18,
  stretchSeeking: true,
  producerIdentity: true,
});

// ── SC-2: readiness not age ──────────────────────────────────────────────────────────────────
/** Same readiness signals as INPUTS_S3 but a WILDLY larger monthsInPursuit ⇒ still S3. */
export const INPUTS_S3_OLD: PlanInputs = makeInputs({
  monthsInPursuit: 240,
  voluntaryReturnsRecent: 9,
  depthAccumulation: 10,
  stretchSeeking: true,
  producerIdentity: false,
});

/** High monthsInPursuit but low readiness ⇒ still S1 (age never advances a stage). */
export const INPUTS_HIGH_MONTHS_LOW_READINESS: PlanInputs = makeInputs({
  monthsInPursuit: 240,
  voluntaryReturnsRecent: 1,
  depthAccumulation: 1,
  stretchSeeking: false,
  producerIdentity: false,
});

// ── SC-7: strain holds the stage (S3-ready readiness + a strained wellbeing read) ─────────────
export const INPUTS_S3_STRAINED: PlanInputs = makeInputs({
  monthsInPursuit: 18,
  voluntaryReturnsRecent: 9,
  depthAccumulation: 10,
  stretchSeeking: true,
  producerIdentity: false,
  wellbeing: strainWellbeing("kid-synthetic-001", "music-sound/production::build"),
});

// ── SC-9: plurality — a SECOND spike (different cell) for the same kid, independent readiness ──
export const INPUTS_SECOND_CELL_S1: PlanInputs = makeInputs({
  domainPath: ["games-strategy", "chess"] as const,
  mode: "investigate",
  monthsInPursuit: 3,
  voluntaryReturnsRecent: 2,
  depthAccumulation: 1,
  stretchSeeking: false,
  producerIdentity: false,
});
