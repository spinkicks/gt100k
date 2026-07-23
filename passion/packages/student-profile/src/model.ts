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
  /** synthetic pilot stand-in: cellKey → opaque perseverance-artifact ref (010/D2 later). */
  readonly perseveranceArtifacts: Readonly<Record<string, string>>;
  /** 013 durable lifecycle record for THIS kid. */
  readonly store: HypothesisStore;
  readonly updatedAt: string; // ISO-8601
}

export interface OrchestratorContext {
  readonly catalog: ReadonlyMap<string, Artifact>;
  readonly surfaced?: readonly SurfacedRecord[];
  readonly config?: Partial<PipelineConfig>;
}

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
    perseveranceArtifacts,
    store: emptyStore(),
    updatedAt: "1970-01-01T00:00:00.000Z",
  };
}
