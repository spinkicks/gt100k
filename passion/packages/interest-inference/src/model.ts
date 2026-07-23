// Golden constants — see specs/011-interest-inference/spec.md §3.2. Copied verbatim.
export const ALPHA0 = 1;
export const BETA0 = 1;
export const W_ENV = 0.5;
export const W_APT = 0.5;
export const W_XP = 0.5;
export const A_RETURN = 1.0;
export const A_DEPTH = 0.5;
export const B_SKIP = 0.5;
export const HALFLIFE_DAYS = 14;
export const MIN_EVIDENCE_MASS = 3;
export const MAX_CI_WIDTH = 0.35;
export const K_LCB = 1.0;
export const SPIKE_THRESHOLD = 0.6;
export const MAX_CANDIDATES = 3;
export const ATTR_MARGIN = 0.1;

export const DEPTH_FAMILIES = [
  "unrequired_revision",
  "chosen_challenge",
  "failure_recovery",
  "self_authored_scope",
  "artifact_competence",
] as const;
export type DepthFamily = (typeof DEPTH_FAMILIES)[number];
export type EventKind = "voluntary_return" | "prompted_return" | DepthFamily | "skip";

export type DomainPath = readonly [string] | readonly [string, string];
export type Attribution = "domain" | "style" | "mixed";

export interface DomainPrior {
  readonly domain: string;
  readonly inEnvironment: boolean;
  readonly aptitudeTilt: number; // [0,1]
  readonly discretionaryTilt: number; // [0,1]
}

export interface CellEvent {
  readonly domainPath: DomainPath;
  readonly mode: string;
  readonly kind: EventKind;
  readonly magnitude: number; // [0,1]
  readonly novelty: boolean;
  readonly timestamp: string; // ISO-8601
}

export interface CellBelief {
  readonly cellKey: string;
  readonly domainPath: DomainPath;
  readonly mode: string;
  readonly alpha: number;
  readonly beta: number;
  readonly mean: number;
  readonly sd: number;
  readonly lowerBound: number;
  readonly evidenceMass: number;
  readonly confident: boolean;
  readonly attribution: Attribution | null;
  readonly supporting: readonly string[];
  readonly disconfirming: readonly string[];
}

export interface Candidate {
  readonly cellKey: string;
  readonly domainPath: DomainPath;
  readonly mode: string;
  readonly lowerBound: number;
  readonly attribution: Attribution;
}

export interface InterestRead {
  readonly cells: readonly CellBelief[];
  readonly candidates: readonly Candidate[];
}

const DEPTH_SET = new Set<string>(DEPTH_FAMILIES);
export function isDepthFamily(kind: string): kind is DepthFamily {
  return DEPTH_SET.has(kind);
}

export function serializeCellKey(domainPath: DomainPath, mode: string): string {
  const d = domainPath.length === 2 ? `${domainPath[0]}/${domainPath[1]}` : domainPath[0];
  return `${d}::${mode}`;
}

export function recencyWeight(now: number, timestamp: string): number {
  const parsed = Date.parse(timestamp);
  if (Number.isNaN(parsed)) return 1; // unparseable timestamp → no decay (never NaN-poison alpha)
  const ageMs = Math.max(0, now - parsed);
  return Math.pow(0.5, ageMs / 86400000 / HALFLIFE_DAYS);
}

// Clamp a documented [0,1] input; NaN → 0. Guards magnitude / tilt inputs against out-of-range poisoning.
export function clamp01(x: number): number {
  if (Number.isNaN(x)) return 0;
  return x < 0 ? 0 : x > 1 ? 1 : x;
}
