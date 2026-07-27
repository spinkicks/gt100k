/**
 * The shape of a cited claim. Zero dependencies on purpose: every surface (guide console,
 * parent guide, evidence explorer, anything guide-facing in the child app) consumes this,
 * so it must not drag in React or a framework.
 */

export interface Source {
  /** e.g. "Nye, Su, Rounds & Drasgow" */
  readonly authors: string;
  readonly year: number;
  /** Resolvable URL, DOI preferred. */
  readonly url: string;
}

/**
 * Where a number or a rule actually comes from. This distinction is the point of the whole
 * registry: dressing a chosen default up as science is the fastest way to lose a guide's
 * trust the first time they look closely.
 */
export type Basis =
  /** A published finding we are relying on. */
  | "evidence"
  /** Our own default. Defensible, but picked by us, not derived from a study. */
  | "chosen"
  /** A legal or regulatory constraint we comply with. */
  | "policy";

/**
 * The age band a finding was actually established in.
 *
 * Structured rather than left to prose in `limit`, because it is the one caveat that can be checked
 * mechanically against the child in front of you. The product spans 6-14 and its evidence does not:
 * the interest-engine memo is specific to 6-8, the discovery app targets 9-12, and several tuned
 * thresholds were set on the first and are applied to the second. Written down, a surface can say
 * "this threshold comes from work on younger children"; left in prose, nobody notices.
 *
 * `structural` is for findings whose mechanism is not age-bounded even though the study had an age:
 * that choice predicts durable interest better than duration is a claim about what the signal IS,
 * not a number tuned to a cohort. `mvp-jul24`'s PROJECT.md draws the same line and it is the right
 * one — the age-bounded figures are block length, the vigilance decrement, the parent-report window
 * and reward effect sizes; the structural claims travel.
 */
export type EvidenceBand = "6-8" | "9-11" | "12-14" | "6-14" | "adult" | "structural";

export interface Claim {
  /** Stable id referenced by UI call sites. Never rename; add a new one instead. */
  readonly id: string;
  /** The thing as it appears on screen, e.g. "Voluntary returns". */
  readonly label: string;
  /** ONE plain sentence a non-expert guide can act on. No jargon. */
  readonly why: string;
  readonly basis: Basis;
  /** At least one for `evidence` and `policy`. May be empty for `chosen`. */
  readonly sources: readonly Source[];
  /** Honest caveat: thin evidence, contested finding, or a different population. */
  readonly limit?: string;
  /**
   * The band this was established in. Required on `evidence`; optional on `chosen` and `policy`,
   * where there is no study to have a population.
   */
  readonly band?: EvidenceBand;
  /** Grouping for the Evidence base page. */
  readonly area: "Reading the child" | "Wellbeing" | "The plan" | "Family" | "How we measure";
}
