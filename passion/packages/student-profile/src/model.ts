// @gt100k/student-profile — the per-kid longitudinal record + pure discovery orchestrator.
// The interaction log is the source of truth (inference recomputes from the full log each cycle);
// the store is the durable, human-revisable lifecycle record. Reuse the engine types — never redefine.
import type { Interaction, SurfacedRecord, PipelineConfig } from "@gt100k/signal-pipeline";
import type { DomainPrior } from "@gt100k/interest-inference";
import type { HypothesisStore } from "@gt100k/hypothesis-store";
import { emptyStore } from "@gt100k/hypothesis-store";
import type { Artifact } from "@gt100k/two-axis-tagging";

export const STUDENT_PROFILE_PACKAGE = "@gt100k/student-profile" as const;

export interface StudentProfile {
  readonly kidId: string;
  readonly displayName: string;
  /** 011 DomainPrior; synthetic now, TimeBack-fed later (never gate on priors). */
  readonly priors: readonly DomainPrior[];
  /** 012 Interaction; APPEND-ONLY log = the longitudinal source of truth. */
  readonly interactions: readonly Interaction[];
  /**
   * 012 SurfacedRecord; APPEND-ONLY, and the other half of that truth.
   *
   * What was offered is not derivable from what was taken, and two things need it. The
   * disconfirming signals (skip, decline) are defined as offered-minus-engaged, so without this log
   * a child shown five cabins who takes one is indistinguishable from a child shown only that one.
   * And the novelty window dates from first *exposure*, which is usually a surfacing rather than an
   * engagement, so discarding these does not merely drop evidence, it redates what is left.
   *
   * This lived on `OrchestratorContext` until 2026-07-27, where it was rebuilt per call and never
   * persisted. Nothing ever populated it, so every read this package has produced was derived with
   * no offer history at all.
   */
  readonly surfaced: readonly SurfacedRecord[];
  /** synthetic pilot stand-in: cellKey → opaque perseverance-artifact ref (010/D2 later). */
  readonly perseveranceArtifacts: Readonly<Record<string, string>>;
  /** 013 durable lifecycle record for THIS kid. */
  readonly store: HypothesisStore;
  readonly updatedAt: string; // ISO-8601
}

export interface OrchestratorContext {
  readonly catalog: ReadonlyMap<string, Artifact>;
  readonly config?: Partial<PipelineConfig>;
}

/**
 * One batch of new observations: what the child was shown, and what they did.
 *
 * The two travel together on purpose. They used to arrive by different routes, interactions as an
 * argument and surfacings on the context, and that is why the surfacings were dropped: the API let
 * a caller append one and never think about the other.
 */
export interface CycleBatch {
  readonly interactions: readonly Interaction[];
  readonly surfaced: readonly SurfacedRecord[];
}

/** A cycle that observes nothing, for replays and for the SC-2 no-op invariant. */
export const EMPTY_BATCH: CycleBatch = { interactions: [], surfaced: [] };

export type Roster = ReadonlyMap<string /*kidId*/, StudentProfile>;

/** A blank profile: empty log, empty store, epoch `updatedAt`. Priors/artifacts are optional. */
export function emptyProfile(
  kidId: string,
  displayName: string,
  priors: readonly DomainPrior[] = [],
  perseveranceArtifacts: Readonly<Record<string, string>> = {},
): StudentProfile {
  return {
    kidId,
    displayName,
    priors,
    interactions: [],
    surfaced: [],
    perseveranceArtifacts,
    store: emptyStore(),
    updatedAt: "1970-01-01T00:00:00.000Z",
  };
}
