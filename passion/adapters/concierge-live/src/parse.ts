// src/parse.ts — schema-validate raw TFY (OpenAI-compatible) JSON response strings into the
// concierge port verdicts. Every parser returns `null` on ANYTHING malformed (bad JSON, a
// missing/wrong-typed field, an out-of-range score) so a bad model response becomes a failed
// parse — the calling adapter then uses its SAFE fallback (refuse / drop / escalate / ungrounded),
// never a throw and never fabricated safety. Pure + hermetic: no network, no side effects.
import { reputationOf } from "@gt100k/concierge";
import type {
  Citation,
  DistressVerdict,
  FaithfulnessVerdict,
  GeneratedAnswer,
  ModerationVerdict,
} from "@gt100k/concierge";

/** Parse a JSON string to a plain object, or `null` on bad JSON / non-object. */
function parseObject(raw: string): Record<string, unknown> | null {
  let obj: unknown;
  try {
    obj = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) return null;
  return obj as Record<string, unknown>;
}

/** `{ safe: boolean, reason?: string }` → {@link ModerationVerdict}, or `null` if malformed. */
export function parseModeration(raw: string): ModerationVerdict | null {
  const o = parseObject(raw);
  if (!o || typeof o["safe"] !== "boolean") return null;
  const reason = typeof o["reason"] === "string" ? o["reason"] : undefined;
  return reason === undefined ? { safe: o["safe"] } : { safe: o["safe"], reason };
}

/** `{ distress: boolean, reason?: string }` → {@link DistressVerdict}, or `null` if malformed. */
export function parseDistress(raw: string): DistressVerdict | null {
  const o = parseObject(raw);
  if (!o || typeof o["distress"] !== "boolean") return null;
  const reason = typeof o["reason"] === "string" ? o["reason"] : undefined;
  return reason === undefined ? { distress: o["distress"] } : { distress: o["distress"], reason };
}

/** `{ grounded: boolean, score: 0..1 }` → {@link FaithfulnessVerdict}, or `null` if malformed. */
export function parseFaithfulness(raw: string): FaithfulnessVerdict | null {
  const o = parseObject(raw);
  if (!o || typeof o["grounded"] !== "boolean") return null;
  const score = o["score"];
  if (typeof score !== "number" || Number.isNaN(score) || score < 0 || score > 1) return null;
  return { grounded: o["grounded"], score };
}

/**
 * `{ text: string, citations: [{ url, title }] }` → {@link GeneratedAnswer}, or `null` if malformed.
 * Reputation is RECOMPUTED from each citation URL via {@link reputationOf} — a model claim about a
 * source's trustworthiness is never taken at face value ([D2]).
 */
export function parseGeneration(raw: string): GeneratedAnswer | null {
  const o = parseObject(raw);
  if (!o || typeof o["text"] !== "string" || !Array.isArray(o["citations"])) return null;
  const citations: Citation[] = [];
  for (const c of o["citations"]) {
    if (typeof c !== "object" || c === null) return null;
    const cit = c as Record<string, unknown>;
    if (typeof cit["url"] !== "string" || typeof cit["title"] !== "string") return null;
    citations.push({ url: cit["url"], title: cit["title"], reputation: reputationOf(cit["url"]) });
  }
  return { text: o["text"], citations };
}
