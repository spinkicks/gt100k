// Synthetic SpecializationPlan fixtures — one per stage (S1…S4) naming its mentor role + audience
// level, plus a craft-floor-failure variant and a plurality (second-cell) plan. SYNTHETIC ONLY.
//
// Built by hand (a minimal valid SpecializationPlan literal) — we do NOT run the real 018 planner
// engine here; we only need a well-typed plan whose `cellKey` matches the seed catalog and whose
// (stage, mentorRole, audience, nextProject.craftScaffold) name the current-stage need the broker
// reads. `cellKey`s are reused verbatim from `catalog.ts`.
import type {
  AudienceLevel,
  DomainPath,
  MentorRole,
  SpecializationPlan,
  Stage,
} from "../model.js";
import { CELL_AUDIO, CELL_GAMEDEV, CELL_CHESS } from "./catalog.js";

const KID = "kid-synthetic-023";

interface MakePlanArgs {
  readonly kidId?: string;
  readonly cellKey: string;
  readonly domainPath: DomainPath;
  readonly mode: string;
  readonly stage: Stage;
  readonly mentorRole: MentorRole;
  readonly audience: AudienceLevel;
  /** empty ⇒ the craft-floor-failure variant (audience must be != SELF to trip the gate). */
  readonly craftScaffold: string;
}

/** Assemble a minimal, valid SpecializationPlan literal with sensible defaults. */
export function makePlan(args: MakePlanArgs): SpecializationPlan {
  const kidId = args.kidId ?? KID;
  return {
    kidId,
    cellKey: args.cellKey,
    domainPath: args.domainPath,
    mode: args.mode,
    stage: args.stage,
    mentorRole: args.mentorRole,
    audience: args.audience,
    cadence: "MANY_SHORT",
    dpDose: 0.15,
    restCadence: { daysOffPerWeek: 2, monthsOffPerYear: 3, offInIncrementsOfMonths: 1 },
    pcdeFocus: ["enjoyment"],
    nextProject: {
      title: `A ${args.mode} project in ${args.cellKey}`,
      drivingQuestion: "What can I make that is genuinely mine?",
      authenticMethod: "real methodology of the field",
      audience: args.audience,
      childOwnsChoice: true,
      craftScaffold: args.craftScaffold,
      successLooksLike: "I kept going after the first thing broke.",
      source: "stub",
    },
    replan: { deload: false, restWindow: false, autonomyUp: false, holdStage: false },
    escalateToHuman: false,
    rationale: "synthetic fixture plan",
    guardrailNotes: [],
    terminalNote: "a ready-to-invest performer, not an expert",
  };
}

// ── One plan per stage ────────────────────────────────────────────────────────────────────────────
/** S1: warm mentor, no real audience yet (SELF). On the game-dev cell (age/stage-gate proofs). */
export const PLAN_S1: SpecializationPlan = makePlan({
  cellKey: CELL_GAMEDEV,
  domainPath: ["code-computers", "game-dev"],
  mode: "build",
  stage: "S1_IGNITION",
  mentorRole: "WARM",
  audience: "SELF",
  craftScaffold: "make one thing move on screen",
});

/** S2: technical mentor + mentor-peer audience. On the rich audio cell. */
export const PLAN_S2: SpecializationPlan = makePlan({
  cellKey: CELL_AUDIO,
  domainPath: ["music-sound", "audio-systems"],
  mode: "build",
  stage: "S2_FOUNDATIONS",
  mentorRole: "TECHNICAL",
  audience: "MENTOR_PEERS",
  craftScaffold: "solder one clean crossover",
});

/** S3: domain-expert mentor + real-community audience. On the rich audio cell. */
export const PLAN_S3: SpecializationPlan = makePlan({
  cellKey: CELL_AUDIO,
  domainPath: ["music-sound", "audio-systems"],
  mode: "build",
  stage: "S3_AUTHORSHIP",
  mentorRole: "DOMAIN_EXPERT",
  audience: "REAL_COMMUNITY",
  craftScaffold: "measure and correct one enclosure's response",
});

/** S4: master mentor + field audience. On the rich audio cell. */
export const PLAN_S4: SpecializationPlan = makePlan({
  cellKey: CELL_AUDIO,
  domainPath: ["music-sound", "audio-systems"],
  mode: "build",
  stage: "S4_SIGNATURE",
  mentorRole: "MASTER",
  audience: "FIELD",
  craftScaffold: "voice a signature loudspeaker end-to-end",
});

/** SC-4 craft-floor failure: audience above SELF but an EMPTY craftScaffold ⇒ the audience is blocked. */
export const PLAN_S3_NO_SCAFFOLD: SpecializationPlan = makePlan({
  cellKey: CELL_AUDIO,
  domainPath: ["music-sound", "audio-systems"],
  mode: "build",
  stage: "S3_AUTHORSHIP",
  mentorRole: "DOMAIN_EXPERT",
  audience: "REAL_COMMUNITY",
  craftScaffold: "   ", // whitespace only ⇒ trim().length === 0
});

/** Plurality: an independent second spike (chess/perform) planned on its own. */
export const PLAN_S3_CHESS: SpecializationPlan = makePlan({
  cellKey: CELL_CHESS,
  domainPath: ["games-strategy", "chess"],
  mode: "perform",
  stage: "S3_AUTHORSHIP",
  mentorRole: "DOMAIN_EXPERT",
  audience: "REAL_COMMUNITY",
  craftScaffold: "annotate one of your own lost games",
});
