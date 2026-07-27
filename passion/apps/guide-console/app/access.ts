// Pure Access view-model for the guide console (023-access-broker, D3 + D4). For the selected child,
// for each CERTIFIED spike (ACTIVE / CANDIDATE) the Plan panel already plans, take the SAME
// SpecializationPlan + the SAME 016 wellbeing read, and run the pure `brokerAccess` engine against a
// SYNTHETIC opportunity catalog keyed to that spike's cell. The engine ranks the mentor + audience
// matches and applies every guardrail gate (stage / craft-floor / wellbeing back-off / vetting / age).
// The system proposes; the guide disposes (the lifecycle actions live in the panel). No child-facing
// field, no score/rank anywhere.
import {
  brokerAccess,
  deriveBrokerInputs,
  makeCatalog,
  type AgeBand,
  type AudienceLevel,
  type BrokerPlan,
  type MentorRole,
  type MentorSourceLayer,
  type Opportunity,
  type Stage,
} from "@gt100k/access-broker";
import type { HypothesisStore } from "@gt100k/hypothesis-store";
import type { DomainPath } from "@gt100k/specialization-planner";
import { ROSTER_NOW } from "./console-data.js";
import { plansForKid, type PlanCardVM } from "./plan.js";
import { wellbeingForKid } from "./wellbeing.js";

// The console grounds against a synthetic age tier (readiness, not age, drives the engine; this only
// filters age-appropriate opportunities). Matches the Plan panel's PLAN_AGE_TIER.
const CONSOLE_AGE_BAND: AgeBand = "12-14";

export interface AccessCardVM {
  readonly id: string;
  readonly cellKey: string;
  readonly domainPath: DomainPath;
  readonly mode: string;
  readonly state: string;
  readonly mentorRole: MentorRole;
  readonly audience: AudienceLevel;
  readonly brokerPlan: BrokerPlan;
}

// The relay layer that delivers each mentor role, plus a second (lower-reputation) alternative, so the
// guide sees a short ranked list rather than a single take-it-or-leave-it option (PRD §7.3 layers).
const PRIMARY_LAYER: Record<MentorRole, MentorSourceLayer> = {
  WARM: "AI",
  TECHNICAL: "AI",
  DOMAIN_EXPERT: "THIN_EXPERT",
  MASTER: "MASTER",
};
const SECONDARY_LAYER: Record<MentorRole, MentorSourceLayer> = {
  WARM: "FAMILY",
  TECHNICAL: "THIN_EXPERT",
  DOMAIN_EXPERT: "NEAR_PEER",
  MASTER: "NEAR_PEER",
};
const LAYER_TITLE: Record<MentorSourceLayer, string> = {
  AI: "AI coach",
  FAMILY: "Family-network mentor",
  NEAR_PEER: "Near-peer apprentice",
  THIN_EXPERT: "Vetted expert reviewer",
  MASTER: "Master mentor",
};

function leafOf(domainPath: DomainPath): string {
  const leaf = domainPath[domainPath.length - 1] ?? "";
  return leaf.replace(/[-/]/g, " ");
}

// A small SYNTHETIC opportunity set for ONE certified spike, keyed to its real cellKey, covering the
// mentor role the plan named (two ranked layers) + the audience level it named (two channels, unless
// the level is SELF and there is no audience to broker yet). Deterministic — no clock/random.
function opportunitiesForCard(card: PlanCardVM): readonly Opportunity[] {
  const cell = card.cellKey;
  const role = card.plan.mentorRole;
  const level = card.plan.audience;
  const leaf = leafOf(card.domainPath);
  const base = {
    cellKey: cell,
    minStage: "S1_IGNITION" as Stage,
    ageTier: CONSOLE_AGE_BAND,
    vetting: "vetted" as const,
  };

  const out: Opportunity[] = [
    {
      ...base,
      id: `${card.id}::m-primary`,
      kind: "mentor",
      title: `${LAYER_TITLE[PRIMARY_LAYER[role]]} for ${leaf}`,
      fillsRole: role,
      sourceLayer: PRIMARY_LAYER[role],
      reputation: 0.92,
    },
    {
      ...base,
      id: `${card.id}::m-secondary`,
      kind: "mentor",
      title: `${LAYER_TITLE[SECONDARY_LAYER[role]]} for ${leaf}`,
      fillsRole: role,
      sourceLayer: SECONDARY_LAYER[role],
      reputation: 0.8,
    },
  ];

  if (level !== "SELF") {
    out.push(
      {
        ...base,
        id: `${card.id}::a-competition`,
        kind: "audience",
        title: `${leaf} showcase competition`,
        level,
        channel: "COMPETITION",
        reputation: 0.9,
        availability: { deadline: "2026-11-15" },
      },
      {
        ...base,
        id: `${card.id}::a-community`,
        kind: "audience",
        title: `${leaf} maker community`,
        level,
        channel: "COMMUNITY",
        reputation: 0.82,
      },
    );
  }

  return out;
}

/** The selected child's per-certified-spike broker plans (ranked matches + the access-transfer state). */
export function accessForKid(kidId: string, store?: HypothesisStore): readonly AccessCardVM[] {
  // Threaded straight through: Access is downstream of the plans, so it was silent for exactly as
  // long as they were.
  const cards = plansForKid(kidId, store);
  if (cards.length === 0) return [];

  const reads = new Map(wellbeingForKid(kidId).map((c) => [c.cellKey, c.read]));
  const catalog = makeCatalog(cards.flatMap(opportunitiesForCard));

  const out: AccessCardVM[] = [];
  for (const card of cards) {
    const read = reads.get(card.cellKey);
    if (!read) continue;
    const inputs = deriveBrokerInputs(card.plan, read, CONSOLE_AGE_BAND);
    const brokerPlan = brokerAccess(inputs, { catalog }, ROSTER_NOW);
    out.push({
      id: card.id,
      cellKey: card.cellKey,
      domainPath: card.domainPath,
      mode: card.mode,
      state: card.state,
      mentorRole: card.plan.mentorRole,
      audience: card.plan.audience,
      brokerPlan,
    });
  }
  return out;
}

/** How many proposed matches (mentor + audience) the child has waiting for the guide, for the tab count. */
export function accessProposalCount(cards: readonly AccessCardVM[]): number {
  return cards.reduce(
    (n, c) => n + c.brokerPlan.mentorMatches.length + c.brokerPlan.audienceMatches.length,
    0,
  );
}

/** True when any spike needs the guide's eyes (a proposal, a held state, or a blocked need). */
export function accessNeedsReview(cards: readonly AccessCardVM[]): boolean {
  return cards.some((c) => c.brokerPlan.escalateToHuman);
}
