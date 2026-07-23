// src/parse.ts
import type { TagSuggestion } from "@gt100k/two-axis-tagging";
import { isWorkMode, isCabinId } from "@gt100k/two-axis-tagging";

/**
 * Schema-validate a raw TFY (OpenAI-compatible) JSON response string into a
 * `TagSuggestion`. Returns `null` on anything malformed — bad JSON, a missing/
 * wrong-shaped field, an unknown cabin, or an invalid work-mode — so a bad model
 * response becomes a failed suggestion (routed to the review queue), never a throw.
 */
export function parseTfySuggestion(raw: string): TagSuggestion | null {
  let obj: unknown;
  try {
    obj = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof obj !== "object" || obj === null) return null;
  const o = obj as Record<string, unknown>;

  const path = o["domainPath"];
  if (!Array.isArray(path) || path.length < 1 || path.length > 2) return null;
  const cabin = path[0];
  if (!isCabinId(cabin)) return null;
  if (path.length === 2 && typeof path[1] !== "string") return null;

  const modes = o["affordedModes"];
  if (!Array.isArray(modes) || modes.length === 0 || !modes.every(isWorkMode)) return null;

  const confidence = o["confidence"];
  if (typeof confidence !== "number" || Number.isNaN(confidence) || confidence < 0 || confidence > 1) {
    return null;
  }

  const rationale = typeof o["rationale"] === "string" ? o["rationale"] : "";

  return {
    domainPath: path.length === 2 ? [cabin, path[1] as string] : [cabin],
    affordedModes: modes,
    confidence,
    rationale,
  };
}
