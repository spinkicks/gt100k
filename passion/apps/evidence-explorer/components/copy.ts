/**
 * Plain-language vocabulary (Phase 1). Pure + framework-free so it is unit-testable without a DOM.
 * The surface reads plainly by default; the precise technical strings still live verbatim behind the
 * Verify "how we checked" detail and the Inspector fields — this module never hides a fact, it only
 * chooses the plain word for it.
 */
import type { NodeType } from "@gt100k/evidence-graph";

/** Story-first framing for the header. Swap freely — kept general (works for any project). */
export const HEADLINE = "How this project was built";
export const SUBTITLE = "A record of every step of the work, and that can't be faked.";
export const DEMO_BADGE = "Demo data";

const GLOSS: Record<NodeType, string> = {
  Artifact: "a file or draft",
  Attempt: "a run or test",
  Transformation: "a plan step",
  Claim: "a reflection",
  Assistance: "help used",
  Contribution: "a credit or source",
  Review: "a mentor note",
  Outcome: "a result",
};

/** The plain gloss for a node type (shown alongside the type name, never replacing it). */
export function nodeGloss(type: NodeType): string {
  return GLOSS[type] ?? "";
}

/** The plain top-line verify result. Technical checks stay verbatim in the Verify detail. */
export function verifyLine(verified: boolean): string {
  return verified
    ? "Verified. Nothing here has changed since it was recorded."
    : "Changed. This record no longer matches what was originally recorded.";
}
