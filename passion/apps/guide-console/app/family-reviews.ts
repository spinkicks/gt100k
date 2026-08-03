// The guide's family-pressure REVIEW acknowledgments: which children's flagged family pressure the
// guide has looked at, so the promote it gates can be released for that child.
//
// KEPT SEPARATE FROM THE HYPOTHESIS DECISION LOG (decisions.ts) on purpose. That log is replayed
// through 013's own transitions and must stay a pure record of hypothesis actions; a whole-child
// family review is neither a hypothesis action nor safe to fold into a store the legality table
// guards. Same scope caveat decisions.ts carries: browser-local and synthetic, because until G3
// (identity / consent / retention) exists there is no honest "this guide" to attach it to, so it
// lives in the browser that made it.
export const FAMILY_REVIEWS_KEY = "gt100k.guide-console.family-reviews";

/**
 * Read the stored set of reviewed child ids. Anything unparseable is an empty set rather than a
 * thrown error, and a half-valid list costs the guide the bad entries rather than all of them --
 * the same demo-convenience posture parseDecisionLog takes, for the same reason.
 */
export function parseFamilyReviews(raw: string | null): string[] {
  if (raw === null) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  return parsed.filter((x): x is string => typeof x === "string" && x !== "");
}
