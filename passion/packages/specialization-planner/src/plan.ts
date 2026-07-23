// The pure plan engine `planSpecialization` (spec §3.3–§3.5) — CORE. Given one spike's readiness
// signals + a 016 wellbeing read, it assembles the staged blueprint (mentor relay, audience,
// cadence, bounded DP, rest, PCDE focus) from the §3.1 table + §3.7 constants, folds in the
// wellbeing replan, sets `escalateToHuman` (system proposes, human disposes), and generates the next
// authentic Type III project via the port — falling back to the deterministic stub on any failure so
// `nextProject` is NEVER empty/invalid. Every guardrail invariant (§3.5) is baked in:
//   • DP rises with stage but is always < INVESTMENT_LOAD; a lower (held) stage lowers the dose.
//   • Rest is mandatory (AAP), present on every plan.
//   • The child always owns the problem/method/pace (the brief is an offer).
//   • Strain HOLDS the stage (counter-cyclical) — a strained learner is never advanced.
//   • No score/grade/reward/streak/rank field anywhere.
import type { CuratedResource } from "@gt100k/concierge";
import {
  DP_BY_STAGE,
  INVESTMENT_LOAD,
  REST_DAYS_PER_WEEK,
  REST_INCREMENT_MONTHS,
  REST_MONTHS_PER_YEAR,
  type AudienceLevel,
  type BriefContext,
  type MentorRole,
  type Pcde,
  type PlanInputs,
  type ProjectBrief,
  type ProjectBriefGenerator,
  type ProjectCadence,
  type Replan,
  type RestCadence,
  type SpecializationPlan,
  type Stage,
} from "./model.js";
import { deriveStage } from "./stage.js";
import { buildStubBrief } from "./stub-generator.js";

// ── The §3.1 stage → blueprint tables ────────────────────────────────────────────────────────
const MENTOR_BY_STAGE: Record<Stage, MentorRole> = {
  S1_IGNITION: "WARM",
  S2_FOUNDATIONS: "TECHNICAL",
  S3_AUTHORSHIP: "DOMAIN_EXPERT",
  S4_SIGNATURE: "MASTER",
};

const AUDIENCE_BY_STAGE: Record<Stage, AudienceLevel> = {
  S1_IGNITION: "SELF",
  S2_FOUNDATIONS: "MENTOR_PEERS",
  S3_AUTHORSHIP: "REAL_COMMUNITY",
  S4_SIGNATURE: "FIELD",
};

const CADENCE_BY_STAGE: Record<Stage, ProjectCadence> = {
  S1_IGNITION: "MANY_SHORT",
  S2_FOUNDATIONS: "TERM_LENGTH",
  S3_AUTHORSHIP: "MAJOR_TYPE_III",
  S4_SIGNATURE: "FLAGSHIP",
};

const PCDE_BY_STAGE: Record<Stage, readonly Pcde[]> = {
  S1_IGNITION: ["enjoyment", "relatedness", "identity", "self_regulation"],
  S2_FOUNDATIONS: ["goal_setting", "quality_practice", "planning", "self_evaluation"],
  S3_AUTHORSHIP: ["coping_feedback", "strategic_risk", "self_advocacy"],
  S4_SIGNATURE: ["self_direction", "resilience", "networking", "producer_identity"],
};

const CRAFT_FLOOR_HINT: Record<Stage, string> = {
  S1_IGNITION:
    "Keep it playful — the only floor is noticing what you enjoy and choosing to come back.",
  S2_FOUNDATIONS:
    "Pair the project with one small, chosen, bounded practice on a core technique.",
  S3_AUTHORSHIP:
    "Anchor the project with a chosen, capped practice on the craft your audience will notice.",
  S4_SIGNATURE:
    "Sustain a chosen, still-capped practice on the craft that sharpens your voice.",
};

const STAGE_PURPOSE: Record<Stage, string> = {
  S1_IGNITION: "fall in love and keep coming back",
  S2_FOUNDATIONS: "get precise without killing the fun",
  S3_AUTHORSHIP: "make it real for a community",
  S4_SIGNATURE: "find your voice — portfolio-defining work",
};

const TERMINAL_NOTE =
  "By ~14 the honest goal is a ready-to-invest performer — a signature body of work, an Evidence " +
  "Graph, and a defensible portfolio — not an expert. Eminence is adult; this plan protects the " +
  "trajectory, never claims to manufacture it.";

/** Demote a stage by one (S4→S3→S2→S1), floored at S1 — the strain hold (never advance) [D-C]. */
function demoteOne(stage: Stage): Stage {
  switch (stage) {
    case "S4_SIGNATURE":
      return "S3_AUTHORSHIP";
    case "S3_AUTHORSHIP":
      return "S2_FOUNDATIONS";
    case "S2_FOUNDATIONS":
      return "S1_IGNITION";
    case "S1_IGNITION":
      return "S1_IGNITION";
  }
}

const MANDATORY_REST: RestCadence = {
  daysOffPerWeek: REST_DAYS_PER_WEEK,
  monthsOffPerYear: REST_MONTHS_PER_YEAR,
  offInIncrementsOfMonths: REST_INCREMENT_MONTHS,
};

/** A brief is valid only if every field is present + non-empty and the child owns the choice. */
function isValidBrief(b: ProjectBrief | null | undefined): b is ProjectBrief {
  return (
    !!b &&
    typeof b.title === "string" &&
    b.title.length > 0 &&
    typeof b.drivingQuestion === "string" &&
    b.drivingQuestion.length > 0 &&
    typeof b.authenticMethod === "string" &&
    b.authenticMethod.length > 0 &&
    typeof b.craftScaffold === "string" &&
    b.craftScaffold.length > 0 &&
    typeof b.successLooksLike === "string" &&
    b.successLooksLike.length > 0 &&
    b.childOwnsChoice === true &&
    (b.source === "stub" || b.source === "llm")
  );
}

/** Generate the next project via the port; fall back to the deterministic stub on any failure. */
async function generateNextProject(
  generator: ProjectBriefGenerator,
  ctx: BriefContext,
): Promise<ProjectBrief> {
  try {
    const brief = await generator.generate(ctx);
    if (isValidBrief(brief)) return brief;
  } catch {
    // fall through to the stub — never surface a throw or an invalid brief
  }
  return buildStubBrief(ctx);
}

export interface PlanDeps {
  readonly generator: ProjectBriefGenerator;
  /** The A6 curated matches (from `curatedForCell`) to ground the craft scaffold. Default []. */
  readonly resources?: readonly CuratedResource[];
}

/**
 * Produce the guide-facing staged plan for ONE spike. Pure apart from the (awaited, fail-safe) brief
 * generation. Per-spike only — it reads only this cell's inputs (plurality is not a discount, [D8]).
 */
/** The sync-computable plan core — everything except the (possibly async) next project brief. */
interface PlanCore {
  readonly stage: Stage;
  readonly replan: Replan;
  readonly escalateToHuman: boolean;
  readonly escalationReason?: string;
  readonly dpDose: number;
  readonly rationale: string;
  readonly guardrailNotes: readonly string[];
  readonly briefContext: BriefContext;
}

/** Derive everything except the brief — pure + synchronous (shared by the async + stub entries). */
function derivePlanCore(inputs: PlanInputs, resources: readonly CuratedResource[]): PlanCore {
  const readinessStage = deriveStage(inputs);
  const w = inputs.wellbeing;
  const strained = w.rest || w.backOff;

  // Strain HOLDS the stage (counter-cyclical): a strained learner is not advanced this cycle.
  const stage: Stage = strained ? demoteOne(readinessStage) : readinessStage;

  const replan: Replan = {
    holdStage: strained,
    deload: strained,
    restWindow: w.rest,
    autonomyUp: strained || w.pressure === "AUTONOMY_UP",
  };

  // System proposes, human disposes: escalate on any rest/deload proposal OR a proposed stage
  // advance (any stage above the default entry, S1_IGNITION). Nothing is applied to the child.
  const proposedAdvance = stage !== "S1_IGNITION";
  const escalateToHuman = replan.restWindow || replan.deload || proposedAdvance;

  const audience = AUDIENCE_BY_STAGE[stage];
  const dpDose = DP_BY_STAGE[stage];

  const briefContext: BriefContext = {
    domainPath: inputs.domainPath,
    mode: inputs.mode,
    stage,
    audience,
    craftFloorHint: CRAFT_FLOOR_HINT[stage],
    resources,
  };

  const escalationReason = strained
    ? "The wellbeing read proposes rest/back-off — holding the stage and reducing load; please review."
    : proposedAdvance
      ? `Proposes ${stage} for this spike — please ratify before committing the child.`
      : undefined;

  const signals: string[] = [
    `${inputs.voluntaryReturnsRecent} recent voluntary returns`,
    `depth accumulation ${inputs.depthAccumulation}`,
  ];
  if (inputs.stretchSeeking) signals.push("voluntarily reaching for harder work");
  if (inputs.producerIdentity) signals.push("shipping/sharing for others");

  const rationale =
    `On readiness signals (${signals.join(", ")}), this spike sits at ${stage} — ` +
    `${STAGE_PURPOSE[stage]}. ${inputs.monthsInPursuit} months in pursuit is indicative only; ` +
    `stages advance on readiness, never age. ` +
    (strained
      ? "The wellbeing read shows strain, so we hold the stage and propose a guilt-free rest / deload and more autonomy — protect the rage to master."
      : "The mentor is a relay and the audience widens with authenticity; deliberate practice stays small and serves the child's own project.");

  const guardrailNotes: readonly string[] = [
    `DP is bounded: ${dpDose} < ${INVESTMENT_LOAD} investment-year load — practice serves the project, never the reverse.`,
    `Rest is mandatory: ${REST_DAYS_PER_WEEK} days/week and ${REST_MONTHS_PER_YEAR} months/year off the primary spike, in ~${REST_INCREMENT_MONTHS}-month increments.`,
    "The child owns the problem, method, and pace — this brief is an offer (opportunity/structure/access), never an assignment.",
    "Trajectory, not eminence — the by-14 artifact is a ready-to-invest performer.",
    ...(strained
      ? ["Strain present — holding the stage and proposing rest/deload to protect the rage to master."]
      : []),
  ];

  return {
    stage,
    replan,
    escalateToHuman,
    ...(escalationReason !== undefined ? { escalationReason } : {}),
    dpDose,
    rationale,
    guardrailNotes,
    briefContext,
  };
}

/** Assemble the final guide-facing plan from the core + a ready next-project brief. */
function assemblePlan(
  inputs: PlanInputs,
  core: PlanCore,
  nextProject: ProjectBrief,
): SpecializationPlan {
  return {
    kidId: inputs.kidId,
    cellKey: inputs.cellKey,
    domainPath: inputs.domainPath,
    mode: inputs.mode,
    stage: core.stage,
    mentorRole: MENTOR_BY_STAGE[core.stage],
    audience: core.briefContext.audience,
    cadence: CADENCE_BY_STAGE[core.stage],
    dpDose: core.dpDose,
    restCadence: MANDATORY_REST,
    pcdeFocus: PCDE_BY_STAGE[core.stage],
    nextProject,
    replan: core.replan,
    escalateToHuman: core.escalateToHuman,
    ...(core.escalationReason !== undefined ? { escalationReason: core.escalationReason } : {}),
    rationale: core.rationale,
    guardrailNotes: core.guardrailNotes,
    terminalNote: TERMINAL_NOTE,
  };
}

/**
 * Produce the guide-facing staged plan for ONE spike via the (async) brief generator port. Per-spike
 * only — reads only this cell's inputs (plurality is not a discount, [D8]). Fail-safe: any generator
 * throw / invalid brief falls back to the deterministic stub.
 */
export async function planSpecialization(
  inputs: PlanInputs,
  deps: PlanDeps,
  now: string,
): Promise<SpecializationPlan> {
  void now;
  const core = derivePlanCore(inputs, deps.resources ?? []);
  const nextProject = await generateNextProject(deps.generator, core.briefContext);
  return assemblePlan(inputs, core, nextProject);
}

/**
 * Synchronous, fully deterministic plan using the in-package stub brief — the default path for the
 * guide-console panel + LOOP_QA (offline, no network, no async render). Grounds the craft scaffold on
 * the passed curated `resources`.
 */
export function planSpecializationWithStub(
  inputs: PlanInputs,
  resources: readonly CuratedResource[],
  now: string,
): SpecializationPlan {
  void now;
  const core = derivePlanCore(inputs, resources);
  return assemblePlan(inputs, core, buildStubBrief(core.briefContext));
}
