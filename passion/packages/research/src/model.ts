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
  /** Grouping for the Evidence base page. */
  readonly area: "Reading the child" | "Wellbeing" | "The plan" | "Family" | "How we measure";
}
