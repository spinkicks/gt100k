import type {
  CandidateSet,
  ChurnBudget,
  CohortAssignment,
  CohortHealthEvent,
  HardConstraints,
  LearnerProfile,
  Role,
  TurnAnalysis,
} from "../../cohort-compiler/src/index.js";
import type { PALETTE, TYPOGRAPHY } from "./art.js";
import type { ConstellationView } from "./layout.js";
import type { MotionKind, MotionSpec } from "./motion.js";
import type { ArenaRoomView } from "./rivalry.js";
import type { StandingsView } from "./standings.js";

export type ViewBand = "6-8" | "9-11" | "12-14";

export interface ViewFlags {
  readonly reducedMotion: boolean;
  readonly plain: boolean;
  readonly band: ViewBand;
  readonly standingsOptIn: boolean;
}

export interface CohortCardView {
  readonly cohortIndex: number;
  readonly members: { readonly ref: string; readonly role: Role }[];
  readonly badges: { readonly constraint: string; readonly satisfied: boolean }[];
  readonly nonHarmFloor: {
    readonly minBenefit: number;
    readonly floor: number;
    readonly allAbove: boolean;
  };
  readonly churnDelta: number;
}

export interface SafeguardingView {
  readonly pending: CohortHealthEvent[];
  readonly pausedMoves: { readonly moveId: string; readonly touches: string[] }[];
  readonly optimizationBypassed: boolean;
}

export interface SafeguardingInput {
  readonly pending: readonly CohortHealthEvent[];
  readonly activeMoves: readonly {
    readonly moveId: string;
    readonly touches: readonly string[];
  }[];
}

export interface VisualBand {
  readonly band: ViewBand;
  readonly labelStyle: "story" | "growth" | "numeric";
  readonly markerScale: number;
  readonly celebrationCeiling: "gentle" | "standard";
}

export interface PresentationView extends VisualBand {
  readonly palette: typeof PALETTE;
  readonly typography: typeof TYPOGRAPHY;
  readonly plain: boolean;
}

export interface LedgerView {
  readonly cohortTree: {
    readonly label: string;
    readonly children: { readonly label: string }[];
  }[];
  readonly standingsText: string | null;
  readonly rivalryList: string[];
  readonly safeguardingAlert: string | null;
  readonly announce: string | null;
}

export interface CohortArenaView {
  readonly constellation: ConstellationView;
  readonly cohorts: CohortCardView[];
  readonly standings: StandingsView | null;
  readonly rivalry: ArenaRoomView | null;
  readonly safeguarding: SafeguardingView;
  readonly motion: Record<MotionKind, MotionSpec>;
  readonly presentation: PresentationView;
  readonly ledger: LedgerView;
}

export interface BuildCohortArenaViewInput {
  readonly assignment: CohortAssignment;
  readonly priorAssignment?: CohortAssignment | null;
  readonly pool?: readonly LearnerProfile[];
  readonly candidateSets?: readonly CandidateSet[];
  readonly hard: HardConstraints;
  readonly churn: ChurnBudget;
  readonly standings?: {
    readonly self: { readonly selfGain: number };
    readonly nearPeers: readonly { readonly pseudonym: string; readonly gain: number }[];
    readonly optedIn: boolean;
  };
  readonly rivalry?: TurnAnalysis | null;
  readonly safeguarding?: SafeguardingInput;
  readonly flags: ViewFlags;
}
