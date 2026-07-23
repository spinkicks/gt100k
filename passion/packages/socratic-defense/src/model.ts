export const FACET_ORDER = ["what", "why", "how", "challenge", "next", "audience"] as const;
export type Facet = (typeof FACET_ORDER)[number];
const FACET_SET = new Set<string>(FACET_ORDER);
export function isFacet(x: unknown): x is Facet {
  return typeof x === "string" && FACET_SET.has(x);
}

export type ReadinessLevel = "emerging" | "developing" | "fluent";
export const MAX_FOLLOWUP: Record<ReadinessLevel, number> = { emerging: 2, developing: 1, fluent: 1 };
export function maxFollowup(level: ReadinessLevel): number {
  return MAX_FOLLOWUP[level];
}

export const THIN = 0.45;
export const COVERED = 0.6;
export const MAX_TURNS = 12;

export interface ProjectProfile {
  readonly id: string;
  readonly studentId: string;
  readonly title: string;
  readonly domain: string;
  readonly summary: string;
  readonly artifactRefs: readonly string[];
}

export interface Judgment {
  readonly facet: Facet;
  readonly coverage: number; // [0,1]
  readonly rationale: string;
  readonly thin: boolean;
}

export interface Turn {
  readonly index: number;
  readonly facet: Facet;
  readonly question: string;
  readonly isFollowUp: boolean;
  readonly answer: string;
  readonly coverage: number;
}

export type CoverageByFacet = Record<Facet, number>;

export interface Session {
  readonly profile: ProjectProfile;
  readonly readinessLevel: ReadinessLevel;
  readonly turns: readonly Turn[];
  readonly coverageByFacet: CoverageByFacet;
  readonly gaps: readonly Facet[];
  readonly status: "active" | "complete";
}

export interface EvidenceRecord {
  readonly studentId: string;
  readonly projectId: string;
  readonly title: string;
  readonly domain: string;
  readonly readinessLevel: ReadinessLevel;
  readonly turns: readonly Turn[];
  readonly coverageByFacet: CoverageByFacet;
  readonly gaps: readonly Facet[];
  readonly createdAt: string;
  readonly contentHash: string;
  // NOTE: intentionally no `grade` field — the tutor emits evidence, never a grade.
}

/**
 * Synchronous content hasher. Declared locally (a one-method structural interface) because
 * `@gt100k/evidence-graph` does NOT re-export its `Hasher` port from its package index, and this
 * feature's scope fence forbids editing evidence-graph. `canonicalize` IS exported and is imported
 * normally.
 */
export interface Hasher {
  hash(input: Uint8Array): string;
}
