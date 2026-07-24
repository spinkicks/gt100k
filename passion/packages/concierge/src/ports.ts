// Typed PORTS for every non-deterministic checkpoint in the pipeline (spec §3.3, [D8]).
// The orchestrator depends ONLY on these interfaces, so the whole pipeline is deterministic +
// offline under stub adapters (CI + the served app) and swaps to TFY/web real adapters behind an
// opt-in flag — exactly the tagger-stub/tagger-tfy split. A port is untrusted: the pipeline treats
// every return as evidence to be checked, and any port that THROWS ⇒ the pipeline fails safe
// (refused), never leaks (SC-9). No implementation lives here — only shapes.
import type { AgeTier, Citation, RetrievedDoc } from "./model.js";

/** Which pipeline stage a moderation call guards — the verdict reason carries it through. */
export type ModerationPhase = "input" | "doc" | "output";

/** A moderation verdict: unsafe ⇒ refuse (input/output) or drop (doc). */
export interface ModerationVerdict {
  readonly safe: boolean;
  readonly reason?: string;
}

/** A distress verdict: distress ⇒ escalate to a human IMMEDIATELY (no retrieval/generation). */
export interface DistressVerdict {
  readonly distress: boolean;
  readonly reason?: string;
}

/** Retrieval options — the age tier biases source strictness (a parameter, one pipeline). */
export interface RetrieveOpts {
  readonly ageTier: AgeTier;
}

/** A grounded, cited generation — cite-or-refuse: no citations / empty text ⇒ the pipeline refuses. */
export interface GeneratedAnswer {
  readonly text: string;
  readonly citations: readonly Citation[];
}

/** A faithfulness verdict: `grounded` is the subset check, `score` the overlap ratio. */
export interface FaithfulnessVerdict {
  readonly grounded: boolean;
  readonly score: number;
}

/** Input/doc/output safety + jailbreak gate (stages 2/5/7). Pure verdict, no side effects. */
export interface Moderator {
  moderate(text: string, tier: AgeTier, phase: ModerationPhase): ModerationVerdict;
}

/** Distress detector (stage 2) — the RAG lane's escape hatch to a human ([D4]). */
export interface DistressClassifier {
  assess(message: string): DistressVerdict;
}

/** Open-web retrieval (stage 4) — returns UNTRUSTED evidence, never an answer ([D2]). */
export interface Retriever {
  search(query: string, opts: RetrieveOpts): Promise<readonly RetrievedDoc[]>;
}

/** Grounded generation (stage 6) — an answer built ONLY from the passed docs, cite-or-refuse ([D5]). */
export interface Generator {
  generate(
    query: string,
    docs: readonly RetrievedDoc[],
    tier: AgeTier,
  ): Promise<GeneratedAnswer>;
}

/** Grounding check (stage 6) — is the answer supported by the docs? ([D5]). */
export interface Faithfulness {
  score(answer: string, docs: readonly RetrievedDoc[]): FaithfulnessVerdict;
}

/** Age-appropriate shaping (stage 8) — reading level/tone/length to the tier's floor. */
export interface Readability {
  shape(text: string, tier: AgeTier): string;
}

/** Provenance digest (stage 10) — stable content hash; the real signer is shared later (E1). */
export interface Hasher {
  hash(bytes: string): string;
}
