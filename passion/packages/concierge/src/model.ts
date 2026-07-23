// Concierge domain model (spec §3.1 + §3.4). Types + golden constants only — no logic.
// Reuses the two-axis (domain × mode) vocabulary so curated resources map to (domain × mode)
// cells and can seed discovery. SYNTHETIC data only.
import type { DomainPath, WorkMode } from "@gt100k/two-axis-tagging";

// --- Age tier: a SERVER FACT on the request (real derivation is G3, out of scope here). ---
export type AgeTier = "6-8" | "9-11" | "12-14";

/** Server-fact tiers, in ascending age order (spec §3.4). */
export const AGE_TIERS = ["6-8", "9-11", "12-14"] as const satisfies readonly AgeTier[];

// --- Requests / responses (§3.1) ---
export interface ConciergeRequest {
  readonly kidId: string;
  readonly ageTier: AgeTier;
  readonly message: string;
  readonly sessionId: string;
}

/** Where a claim came from — attached to a grounded answer. */
export interface Citation {
  readonly url: string;
  readonly title: string;
  readonly reputation: number;
}

/** A curated-library entry, tagged by (domain × mode) so it can seed discovery. */
export interface CuratedResource {
  readonly id: string;
  readonly title: string;
  readonly url: string;
  readonly domainPath: DomainPath;
  readonly affordedModes: readonly WorkMode[];
  readonly reputation: number;
  readonly ageTiers: readonly AgeTier[];
  readonly provenance: string;
}

/** An untrusted open-web document returned by a retriever (§3.1). */
export interface RetrievedDoc {
  readonly url: string;
  readonly title: string;
  readonly text: string;
  readonly reputation: number;
}

/**
 * The single response shape. `kind` discriminates: an `answer` is grounded + cited;
 * `refused` (cite-or-refuse / unsafe) and `escalated` (distress) are the safety exits.
 * Chat is NEVER scored — the most it emits is a testable `probe` suggestion (§3.2 stage 9).
 */
export interface ConciergeResponse {
  readonly kind: "answer" | "refused" | "escalated";
  readonly text?: string;
  readonly citations?: readonly Citation[];
  readonly resources?: readonly CuratedResource[];
  readonly probe?: string;
  readonly reason?: string;
}

// --- Golden constants (§3.4) ---
/** Min grounding score to serve; below this ⇒ refuse (or curated fallback). */
export const FAITHFULNESS_MIN = 0.6;
/** Min source reputation to retain a retrieved doc. */
export const REPUTATION_FLOOR = 0.5;
/** Retrieved docs capped before filtering. */
export const MAX_DOCS = 5;

/**
 * Per-tier strictness — a PARAMETER over one pipeline (spec §3.4, [D1]). The `6-8` tier is
 * strictest: highest grounding floor to serve, smallest/simplest output. `12-14` uses the
 * global `FAITHFULNESS_MIN`. Every tier's floor is >= FAITHFULNESS_MIN.
 */
export interface Strictness {
  /** Grounding score required to serve at this tier (>= FAITHFULNESS_MIN). */
  readonly faithfulnessMin: number;
  /** Readability cap: max characters of served answer text. */
  readonly maxChars: number;
  /** Readability cap: max sentences of served answer text. */
  readonly maxSentences: number;
}

export const STRICTNESS = {
  "6-8": { faithfulnessMin: 0.8, maxChars: 240, maxSentences: 2 },
  "9-11": { faithfulnessMin: 0.7, maxChars: 480, maxSentences: 4 },
  "12-14": { faithfulnessMin: FAITHFULNESS_MIN, maxChars: 960, maxSentences: 8 },
} as const satisfies Record<AgeTier, Strictness>;
