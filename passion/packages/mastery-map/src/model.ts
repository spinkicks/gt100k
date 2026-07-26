// @gt100k/mastery-map — what getting good at a domain actually involves. The specialization planner
// owns PACE (stage, practice dose, rest, back-off) and is deliberately domain-agnostic, so nothing
// in the system knew what getting good at chess involves as distinct from audio production. A map
// supplies that domain knowledge and never touches pace.
//
// Pure + deterministic: no network, no clock, no randomness. Every type below is transcribed from
// specs/2026-07-26-mastery-map-slice1.md; the reasoning lives there and in the design doc, not here.

import type { AgeTier, CuratedResource } from "@gt100k/concierge";
import type { HumanActor } from "@gt100k/hypothesis-store";
import type { Source } from "@gt100k/research";
import type { Stage } from "@gt100k/specialization-planner";
import type { DomainPath, WorkMode } from "@gt100k/two-axis-tagging";

/**
 * What an ordering decision rests on, strongest first. Same idea as `Basis` in @gt100k/research,
 * whose comment is the rule here too: dressing a chosen default up as science is the fastest way to
 * lose a guide's trust the first time they look closely. Separate vocabulary because the question
 * is different; `Source` is reused rather than redefined.
 */
export type OrderingBasis =
  /** A recognised published curriculum: a federation rating syllabus, ABRSM/Trinity grades, an
      olympiad ladder. External and proven, so the claim is checkable by someone other than us. */
  | "syllabus"
  /** Citable research about how this skill develops. */
  | "research"
  /** Named community consensus: an established forum's progression guide, a widely used practice
      curriculum with no formal standing. Real, but not authoritative. */
  | "community"
  /** The model's own reasoning with no external support. Permitted, never hidden, and capped by a
      validator warning. */
  | "model";

export interface Justification {
  /** One plain sentence: why this milestone sits here, and after those. */
  readonly reason: string;
  readonly basis: OrderingBasis;
  /** Required for syllabus, research and community. MUST be empty for `model`. */
  readonly sources: readonly Source[];
  /** Honest caveat: contested, thin, or drawn from a different population or age band. */
  readonly limit?: string;
}

export type MapStatus = "draft" | "published" | "withdrawn";

export type Authorship = "model" | "human-edited" | "human-authored";

export interface ValidationProblem {
  /** Stable code, referenced by tests and by the review screen. Never rename; add a new one. */
  readonly code: string;
  readonly severity: "error" | "warning";
  /** Absent when the problem is about the map as a whole rather than one milestone. */
  readonly milestoneId?: string;
  readonly message: string;
}

export interface ValidationRecord {
  readonly validatedAt: string;
  readonly validatorVersion: string;
  /** MUST be empty to publish. */
  readonly errors: readonly ValidationProblem[];
  /** Surfaced to a guide, never blocking. */
  readonly warnings: readonly ValidationProblem[];
}

export interface MapEdit {
  readonly milestoneId: string;
  readonly actor: HumanActor;
  readonly at: string;
  readonly field: string;
  /** Before and after, so "did human-edited maps produce better outcomes" is answerable and so the
      record shows how the map was actually built, the way the Evidence Graph treats a child's work. */
  readonly before: string;
  readonly after: string;
  readonly note?: string;
}

export interface MapProvenance {
  readonly model: string;
  readonly promptVersion: string;
  readonly generatedAt: string;
  readonly edits: readonly MapEdit[];
}

/**
 * What repeated effort looks like here. Deliberately not a duration or a count: the planner owns
 * dose via `dpDose`, and an hours target would be the weakest kind of claim we could make, since
 * deliberate practice explains 26% of variance in games and its central study failed to replicate.
 */
export interface PracticeForm {
  readonly title: string;
  readonly description: string;
  /** Solitary analysis is often the highest-yield mode and the least visible to adults (Charness et
      al. 2005 found solitary study predicts tournament rating better than tournament play), so the
      map records which it is and the UI must not bury it. */
  readonly solitary: boolean;
}

/**
 * A hint only. The access broker (023) owns real-world contact and guardian consent is a hard
 * blocker there. A map may say tournaments exist; it may never reach into the world.
 */
export interface OpportunityHint {
  readonly kind: "competition" | "showcase" | "community" | "mentorship";
  readonly description: string;
  readonly readinessNote: string;
  /** Overlaps the planner's `AUDIENCE_BY_STAGE`. This is a domain author's note about one specific
      opportunity, not a second audience ladder. Where the two disagree the planner is
      authoritative and this is advisory. */
  readonly stageFloor: Stage;
}

export interface Milestone {
  readonly id: string;
  /** Plain language. A child could read it. */
  readonly title: string;
  /** What the child can DO afterwards. Never what they consumed. */
  readonly capability: string;
  /** Milestone ids. The DAG edges. */
  readonly requires: readonly string[];
  /** Empty = trunk, serves every mode in the domain. Non-empty = a branch, and every entry must
      appear in `MasteryMap.modes`. */
  readonly modes: readonly WorkMode[];
  /** Earliest stage this is appropriate at. The map never advances anyone. Note the dependency:
      nothing above `S2_FOUNDATIONS` is reachable by any child today, because both higher stages
      require `stretchSeeking` and nothing emits `chosen_challenge` (escalated in PR #163). */
  readonly stageFloor: Stage;
  readonly ordering: Justification;
  readonly resources: readonly CuratedResource[];
  readonly practice: readonly PracticeForm[];
  /** The artefact that shows the capability. This is what makes leaving costless: a child who parks
      the domain keeps everything they made, so there is nothing to be sunk. */
  readonly demonstration: string;
  readonly opportunities: readonly OpportunityHint[];
  readonly authorship: Authorship;
}

export interface MasteryMap {
  /** Stable identity, independent of `domainPath`, because the taxonomy will move. */
  readonly id: string;
  /** Bumped on every stored change. The optimistic-concurrency token for `MapStore.put`. */
  readonly version: number;
  /** A map belongs to a DOMAIN, not a cell. Modes are branches off a shared trunk. */
  readonly domainPath: DomainPath;
  /** The modes this domain affords. Every `Milestone.modes` must be a subset of this. */
  readonly modes: readonly WorkMode[];
  /** Plural on purpose. A map runs S1 to S4, roughly ages 6 to 14, so one tier cannot express it. */
  readonly ageBands: readonly AgeTier[];
  readonly milestones: readonly Milestone[];
  readonly provenance: MapProvenance;
  /** Whether the map is VALID. Errors must be empty to publish. */
  readonly validation: ValidationRecord;
  /** Whether the map is IN USE. A different question from validity, kept separate so withdrawing a
      map does not have to pretend the map became invalid. */
  readonly status: MapStatus;
  /** OPTIONAL human review. Not a precondition for use: nobody available to us can certify domain
      correctness, and the child-affecting gates are downstream and already human-owned. */
  readonly vettedBy: HumanActor | null;
  readonly vettedAt: string | null;
  readonly revalidatedAt: string;
}

// ── Chosen defaults, not measurements ────────────────────────────────────────────────────────────
// The central rule of this package is that every ordering decision names what it rests on, so the
// validator's own numbers have to meet the same standard. All four are `chosen` in the sense
// @gt100k/research uses: our own defaults, defensible, picked by us, not derived from a study.

/**
 * Above this share of milestones resting on `basis: "model"`, the map is flagged. A map mostly
 * justified by the model's own confidence is exactly the case the ordering rule exists to expose.
 * CHOSEN: roughly a third feels like the point where "mostly unsupported" becomes fair comment.
 */
export const MODEL_BASIS_MAX_SHARE = 0.34;

/**
 * Below this trunk share, the map is flagged. The design expects a substantial shared trunk, since
 * practice in one mode is often the best predictor of performance in another.
 * CHOSEN: a fifth is a low bar deliberately, because a genuinely branch-heavy domain is possible.
 */
export const TRUNK_MIN_SHARE = 0.2;

/**
 * Resources rot. Past this age a map is flagged as stale in the review screen.
 * CHOSEN: a quarter is short enough to catch dead links and long enough not to nag.
 */
export const STALE_AFTER_DAYS = 90;

/**
 * Divergence is expected around expert entry, so a branch below this is worth a look. Charness et
 * al. put the separation of expert and intermediate profiles around the tenth year of serious play,
 * and Bilalic et al. find sub-specialisation only among titled players.
 * CHOSEN: two studies, both chess. The design calls this a guess with two studies behind it, which
 * is why it is a warning and never an error.
 */
export const EXPERT_ENTRY_STAGE: Stage = "S3_AUTHORSHIP";
