// DETERMINISTIC stub adapters for every port (spec §3.3, [D8]). These power the CI gate and the
// served app — no network, no model, identical output for identical input (SC-9). The real
// TFY/web adapters live in `@gt100k/concierge-live` and are NEVER imported by a test.
//
// Each stub is intentionally simple + auditable:
//   • stubModerator  — denylist keyword match, with a stricter floor for the youngest tier.
//   • stubDistress   — distress-phrase match ⇒ escalate exit.
//   • stubRetriever  — fixture lookup keyed by the (slug-normalized) query.
//   • stubGenerator  — a grounded answer built ONLY from the docs' factual sentences; instruction-
//                      like tokens inside untrusted text are ignored (injection is DATA, [D6]).
//   • stubFaithfulness — answer tokens ⊆ doc tokens (subset = grounded; ratio = score).
//   • stubReadability  — tier-parameterized truncate/simplify (uses STRICTNESS).
//   • stubHasher     — stable FNV-1a digest for provenance.
import { slugify } from "@gt100k/two-axis-tagging";
import {
  STRICTNESS,
  type AgeTier,
  type Citation,
  type RetrievedDoc,
} from "./model.js";
import { SPOTLIGHT_BEGIN, SPOTLIGHT_END } from "./safety.js";
import type {
  DistressClassifier,
  Faithfulness,
  Generator,
  Hasher,
  Moderator,
  Readability,
  Retriever,
} from "./ports.js";

// --- Shared tiny text helpers (deterministic) ---------------------------------------------
/** Lowercase alphanumeric tokens; used by faithfulness grounding. */
function tokenize(text: string): readonly string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 0);
}

/** Split into trimmed, non-empty sentences on terminal punctuation. */
function splitSentences(text: string): readonly string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/** Remove spotlight delimiters so the untrusted payload can be read as plain data. */
function stripSpotlight(text: string): string {
  return text.split(SPOTLIGHT_BEGIN).join("").split(SPOTLIGHT_END).join("").trim();
}

// --- Moderator --------------------------------------------------------------------------------
/** Genuinely unsafe / jailbreak phrases flagged at EVERY tier. */
export const STUB_DENYLIST: readonly string[] = [
  "bomb",
  "weapon",
  "gun",
  "kill",
  "self-harm",
  "suicide",
  "porn",
  "explicit",
  "buy drugs",
  "ignore previous instructions",
  "reveal your system prompt",
];

/** Extra phrases flagged ONLY at the strictest (youngest) tier — the `6-8` floor. */
export const STUB_STRICT_DENYLIST: readonly string[] = ["gambling", "dating", "violence"];

export const stubModerator: Moderator = {
  moderate(text, tier, phase) {
    const hay = text.toLowerCase();
    const list = tier === "6-8" ? [...STUB_DENYLIST, ...STUB_STRICT_DENYLIST] : STUB_DENYLIST;
    const hit = list.find((term) => hay.includes(term));
    return hit ? { safe: false, reason: `${phase}:denylist:${hit}` } : { safe: true };
  },
};

// --- DistressClassifier -----------------------------------------------------------------------
/** Distress markers → escalate to a human (never counsel). Exported for the app's seeded path. */
export const STUB_DISTRESS_PHRASES: readonly string[] = [
  "want to hurt myself",
  "hurt myself",
  "no one likes me",
  "nobody likes me",
  "want to die",
  "kill myself",
  "end it all",
  "hate myself",
];

export const stubDistress: DistressClassifier = {
  assess(message) {
    const hay = message.toLowerCase();
    const hit = STUB_DISTRESS_PHRASES.find((p) => hay.includes(p));
    return hit ? { distress: true, reason: `distress:${hit}` } : { distress: false };
  },
};

// --- Retriever --------------------------------------------------------------------------------
/** A synthetic web corpus keyed by the slug-normalized query. */
export type StubCorpus = ReadonlyMap<string, readonly RetrievedDoc[]>;

/**
 * Build a deterministic retriever over a fixture corpus. Lookups are slug-normalized so
 * "How do tardigrades survive space?" and "how do tardigrades survive space" hit the same key.
 * Ranking + the MAX_DOCS cap are the pipeline's job (this is a pure lookup).
 */
export function stubRetriever(corpus: StubCorpus): Retriever {
  return {
    async search(query) {
      return corpus.get(slugify(query).split("-").join(" ")) ?? [];
    },
  };
}

// --- Generator --------------------------------------------------------------------------------
/** Tokens that mark a sentence as an instruction — never folded into an answer ([D6]). */
export const STUB_INSTRUCTION_MARKERS: readonly string[] = [
  "ignore previous",
  "ignore all previous",
  "system prompt",
  "new rule",
  "disregard",
  "instructions:",
];

/** The canned answer emitted when no factual sentence can be grounded ⇒ pipeline refuses (SC-4). */
export const STUB_UNGROUNDED_ANSWER = "I could not find a grounded answer for that.";

function isInstructionLike(sentence: string): boolean {
  const s = sentence.toLowerCase();
  return STUB_INSTRUCTION_MARKERS.some((m) => s.includes(m));
}

export const stubGenerator: Generator = {
  async generate(_query, docs, _tier) {
    if (docs.length === 0) return { text: "", citations: [] };
    const citations: Citation[] = docs.map((d) => ({
      url: d.url,
      title: d.title,
      reputation: d.reputation,
    }));
    // One factual (non-instruction) sentence per doc — injection sentences are ignored as DATA.
    const factual: string[] = [];
    for (const doc of docs) {
      for (const sentence of splitSentences(stripSpotlight(doc.text))) {
        if (isInstructionLike(sentence)) continue;
        factual.push(sentence);
        break;
      }
    }
    const text = factual.length > 0 ? factual.join(" ") : STUB_UNGROUNDED_ANSWER;
    return { text, citations };
  },
};

// --- Faithfulness -----------------------------------------------------------------------------
export const stubFaithfulness: Faithfulness = {
  score(answer, docs) {
    const answerTokens = tokenize(answer);
    if (answerTokens.length === 0) return { grounded: false, score: 0 }; // fail safe: never serve nothing
    const docTokens = new Set(docs.flatMap((d) => tokenize(stripSpotlight(d.text))));
    const hits = answerTokens.filter((t) => docTokens.has(t)).length;
    const score = hits / answerTokens.length;
    const grounded = hits === answerTokens.length; // strict subset
    return { grounded, score };
  },
};

// --- Readability ------------------------------------------------------------------------------
export const stubReadability: Readability = {
  shape(text, tier: AgeTier) {
    const { maxChars, maxSentences } = STRICTNESS[tier];
    const kept = splitSentences(text).slice(0, maxSentences).join(" ");
    return kept.length > maxChars ? kept.slice(0, maxChars).trimEnd() : kept;
  },
};

// --- Hasher -----------------------------------------------------------------------------------
/** Stable, non-crypto FNV-1a (32-bit) digest → 8-hex-char string. Real signer shared later (E1). */
export const stubHasher: Hasher = {
  hash(bytes) {
    let h = 0x811c9dc5; // FNV offset basis
    for (let i = 0; i < bytes.length; i++) {
      h ^= bytes.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0; // FNV prime, kept 32-bit unsigned
    }
    return h.toString(16).padStart(8, "0");
  },
};
