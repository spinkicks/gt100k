// src/parse.ts — schema-validate a raw TFY (OpenAI-compatible) JSON response string into a
// `ProjectBrief`, coercing/falling-back to the deterministic stub on ANYTHING malformed (bad JSON,
// a missing/empty/wrong-typed field). A bad model response therefore becomes a valid stub brief —
// never a throw, never an empty/invalid `nextProject`. Pure + hermetic: NO network, no side effects,
// no env. (This is the only module the parse test imports — never `./index.js`.)
import { buildStubBrief } from "@gt100k/specialization-planner";
import type { BriefContext, ProjectBrief } from "@gt100k/specialization-planner";

/** The model-authored text fields of a brief. audience/childOwnsChoice/source are set by the adapter. */
export interface BriefFields {
  readonly title: string;
  readonly drivingQuestion: string;
  readonly authenticMethod: string;
  readonly craftScaffold: string;
  readonly successLooksLike: string;
}

const REQUIRED_KEYS = [
  "title",
  "drivingQuestion",
  "authenticMethod",
  "craftScaffold",
  "successLooksLike",
] as const;

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

/**
 * Extract the five required text fields, or `null` if any is missing, non-string, or empty.
 * A model that omits or blanks a Type III criterion fails the parse (⇒ the caller uses the stub).
 */
export function parseBriefFields(raw: string): BriefFields | null {
  const o = parseObject(raw);
  if (!o) return null;
  const out: Record<string, string> = {};
  for (const k of REQUIRED_KEYS) {
    const v = o[k];
    if (typeof v !== "string" || v.trim().length === 0) return null;
    out[k] = v;
  }
  return {
    title: out["title"]!,
    drivingQuestion: out["drivingQuestion"]!,
    authenticMethod: out["authenticMethod"]!,
    craftScaffold: out["craftScaffold"]!,
    successLooksLike: out["successLooksLike"]!,
  };
}

/**
 * Coerce a raw TFY response into a `ProjectBrief` grounded in `ctx`: on a valid parse, build an
 * `llm`-sourced brief (audience from the context, `childOwnsChoice: true`); on ANY malformed/empty
 * response, fall back to the deterministic in-package stub (`source: "stub"`). Guarantees a valid,
 * non-empty Type III brief either way ([D11] fail-safe).
 */
export function coerceBriefOrStub(raw: string, ctx: BriefContext): ProjectBrief {
  const fields = parseBriefFields(raw);
  if (!fields) return buildStubBrief(ctx);
  return {
    title: fields.title,
    drivingQuestion: fields.drivingQuestion,
    authenticMethod: fields.authenticMethod,
    audience: ctx.audience,
    childOwnsChoice: true,
    craftScaffold: fields.craftScaffold,
    successLooksLike: fields.successLooksLike,
    source: "llm",
  };
}
