// brokerAccess — the pure, deterministic matching engine (spec §4.2/§4.3). It reads the D1 plan's
// CURRENT-STAGE named need (mentorRole, audience, stage, cellKey, craftScaffold), queries the catalog
// by cellKey+kind, applies EVERY hard gate, ranks survivors by a fixed-weight deterministic score
// (ties broken by id), and returns the ranked mentor/audience proposals + the reconciled brokerages.
//
// SYSTEM PROPOSES, GUIDE DISPOSES: the engine NEVER emits a Brokerage state past `proposed` — it only
// note-marks/holds existing ones. NO clock, NO randomness (determinism SC-8). NO network.
import type {
  AgeBand,
  Brokerage,
  Opportunity,
  SpecializationPlan,
  Stage,
  WellbeingRead,
  WorkMode,
} from "./model.js";
import { AGE_BANDS, STAGES } from "./model.js";
import type { OpportunityCatalog } from "./catalog.js";

export interface BrokerInputs {
  readonly plan: SpecializationPlan;
  readonly wellbeing: WellbeingRead;
  readonly ageBand: AgeBand;
  readonly existing: readonly Brokerage[];
}

export interface Match {
  readonly opportunity: Opportunity;
  /**
   * The deterministic ranking value in [0,1] (higher = better fit). Named `relevance` (not "score")
   * to honor the hard invariant "no score/rank field on any type" (spec §4.1) — it ranks the
   * OPPORTUNITY for the guide, and is never a child-facing or competitive score.
   */
  readonly relevance: number;
  readonly fit: readonly string[];
  readonly blocked?: string;
}

export interface BrokerPlan {
  readonly kidId: string;
  readonly mentorMatches: readonly Match[];
  readonly audienceMatches: readonly Match[];
  readonly brokerages: readonly Brokerage[];
  readonly held: boolean;
  readonly escalateToHuman: boolean;
  readonly reasons: readonly string[];
}

/** The guide-facing craft-floor block reason (SC-4). */
export const CRAFT_FLOOR_REASON = "craft floor: widen the audience only with a skill scaffold";
/** The wellbeing-hold note stamped on every non-terminal brokerage when rest/back-off is active. */
export const HELD_NOTE = "held: protecting rest";

/** Fixed scoring weights (sum = 1.0) — deterministic, no clock/random. Do not re-open. */
const W = {
  domainFit: 0.35,
  modeFit: 0.15,
  roleOrLevel: 0.25,
  reputation: 0.2,
  availabilitySoon: 0.05,
} as const;

/** Terminal lifecycle states are never re-touched by the engine. */
const TERMINAL_STATES: ReadonlySet<Brokerage["state"]> = new Set(["transferred", "declined"]);

const round4 = (n: number): number => Math.round(n * 10000) / 10000;

const ageOk = (oppAgeTier: AgeBand, kidBand: AgeBand): boolean =>
  AGE_BANDS.indexOf(kidBand) >= AGE_BANDS.indexOf(oppAgeTier);

const stageOk = (oppMinStage: Stage, planStage: Stage): boolean =>
  STAGES.indexOf(oppMinStage) <= STAGES.indexOf(planStage);

function scoreAndFit(
  o: Opportunity,
  plan: SpecializationPlan,
  roleOrLevelMatched: boolean,
): { relevance: number; fit: string[] } {
  const domainFit = o.cellKey === plan.cellKey ? 1 : 0;
  const modeFit = o.modes?.includes(plan.mode as WorkMode) ? 1 : 0;
  const roleOrLevel = roleOrLevelMatched ? 1 : 0;
  const availabilitySoon = o.availability?.deadline ? 1 : 0;

  const relevance = round4(
    W.domainFit * domainFit +
      W.modeFit * modeFit +
      W.roleOrLevel * roleOrLevel +
      W.reputation * o.reputation +
      W.availabilitySoon * availabilitySoon,
  );

  const fit: string[] = [];
  if (domainFit) fit.push(`domain ${plan.cellKey}`);
  if (modeFit) fit.push(`mode ${plan.mode}`);
  if (o.kind === "mentor" && o.fillsRole) {
    fit.push(`fills ${o.fillsRole} role`);
    if (o.sourceLayer) fit.push(`${o.sourceLayer} source`);
  }
  if (o.kind === "audience" && o.level) {
    fit.push(`${o.level} audience`);
    if (o.channel) fit.push(`${o.channel} channel`);
  }
  fit.push(`reputation ${o.reputation}`);
  if (o.availability?.deadline) fit.push(`why now: deadline ${o.availability.deadline}`);
  return { relevance, fit };
}

/** Rank by relevance desc, then id asc (the deterministic tie-break, SC-8). */
function rank(matches: readonly Match[]): Match[] {
  return [...matches].sort((a, b) =>
    b.relevance !== a.relevance
      ? b.relevance - a.relevance
      : a.opportunity.id < b.opportunity.id
        ? -1
        : 1,
  );
}

function surfacableMentors(
  candidates: readonly Opportunity[],
  plan: SpecializationPlan,
  ageBand: AgeBand,
): Match[] {
  const matches: Match[] = [];
  for (const o of candidates) {
    if (o.vetting !== "vetted") continue; // vetting gate
    if (!ageOk(o.ageTier, ageBand)) continue; // age-tier gate
    if (!stageOk(o.minStage, plan.stage)) continue; // stage gate (minStage ≤ plan.stage)
    if (o.fillsRole !== plan.mentorRole) continue; // named-need role match (exclude others, v1)
    const { relevance, fit } = scoreAndFit(o, plan, true);
    matches.push({ opportunity: o, relevance, fit });
  }
  return rank(matches);
}

function surfacableAudiences(
  candidates: readonly Opportunity[],
  plan: SpecializationPlan,
  ageBand: AgeBand,
): { matches: Match[]; blocked?: string } {
  // Craft-floor gate: widening the audience above SELF requires a non-empty craft scaffold.
  if (plan.audience !== "SELF" && plan.nextProject.craftScaffold.trim().length === 0) {
    return { matches: [], blocked: CRAFT_FLOOR_REASON };
  }
  const matches: Match[] = [];
  for (const o of candidates) {
    if (o.vetting !== "vetted") continue; // vetting gate
    if (!ageOk(o.ageTier, ageBand)) continue; // age-tier gate
    if (!stageOk(o.minStage, plan.stage)) continue; // stage gate
    if (o.level !== plan.audience) continue; // named-need level match
    const { relevance, fit } = scoreAndFit(o, plan, true);
    matches.push({ opportunity: o, relevance, fit });
  }
  return { matches: rank(matches) };
}

/**
 * Broker the plan's named mentor + audience need against the catalog, with every gate applied.
 * Returns ranked proposals + reconciled brokerages. NEVER advances a brokerage past `proposed`.
 */
export function brokerAccess(
  inputs: BrokerInputs,
  deps: { catalog: OpportunityCatalog },
  now: string,
): BrokerPlan {
  const { plan, wellbeing, ageBand, existing } = inputs;
  const { catalog } = deps;

  // ── Wellbeing back-off gate (SC-5): rest|backOff ⇒ HOLD all new access, note existing, no advance.
  if (wellbeing.rest || wellbeing.backOff) {
    const brokerages = existing.map((b) =>
      TERMINAL_STATES.has(b.state) ? b : { ...b, note: HELD_NOTE, updatedAt: now },
    );
    return {
      kidId: plan.kidId,
      mentorMatches: [],
      audienceMatches: [],
      brokerages,
      held: true,
      escalateToHuman: true, // a hold always needs the guide's eyes
      reasons: [HELD_NOTE],
    };
  }

  const mentorMatches = surfacableMentors(
    catalog.search({ cellKey: plan.cellKey, kind: "mentor" }),
    plan,
    ageBand,
  );
  const audience = surfacableAudiences(
    catalog.search({ cellKey: plan.cellKey, kind: "audience" }),
    plan,
    ageBand,
  );

  const reasons: string[] = [];
  if (audience.blocked) reasons.push(audience.blocked);

  const escalateToHuman =
    mentorMatches.length > 0 || audience.matches.length > 0 || audience.blocked !== undefined;

  return {
    kidId: plan.kidId,
    mentorMatches,
    audienceMatches: audience.matches,
    brokerages: existing, // non-held: pass through (the engine proposes via matches, not by mutating state)
    held: false,
    escalateToHuman,
    reasons,
  };
}
