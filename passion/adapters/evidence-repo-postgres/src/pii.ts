import type { EvidenceGraph } from "../../../packages/evidence-graph/src/model.js";

/** Matches an obvious email address; deliberately narrow to keep false positives near zero. */
const EMAIL_RE = /[^\s@]+@[^\s@]+\.[^\s@]+/;

function scanStrings(value: unknown, onMatch: (detail: string) => void, path: string): void {
  if (typeof value === "string") {
    if (EMAIL_RE.test(value)) {
      onMatch(path);
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => scanStrings(item, onMatch, `${path}[${index}]`));
    return;
  }
  if (value !== null && typeof value === "object") {
    for (const [key, nested] of Object.entries(value)) {
      scanStrings(nested, onMatch, `${path}.${key}`);
    }
  }
}

/**
 * LIGHT forward-compat guard for the "no raw PII in nodes" habit — NOT a full PII scanner.
 * Throws `PII_ON_GRAPH:<detail>` if any node's `actor.ref`, `actor.displayName`, or any string
 * anywhere in `payload` looks like an email address. Kept intentionally narrow (email only) so
 * pseudonyms like "learner-01" / "Learner" pass cleanly; the goal is to catch the obvious
 * mistake of dropping a raw email onto a node, not to certify a graph as PII-free.
 */
export function assertNoObviousPii(graph: EvidenceGraph): void {
  for (const [id, node] of Object.entries(graph.nodes)) {
    if (EMAIL_RE.test(node.actor.ref)) {
      throw new Error(`PII_ON_GRAPH:node ${id} actor.ref`);
    }
    if (node.actor.displayName !== undefined && EMAIL_RE.test(node.actor.displayName)) {
      throw new Error(`PII_ON_GRAPH:node ${id} actor.displayName`);
    }
    let hit: string | null = null;
    scanStrings(
      node.payload,
      (detail) => {
        hit ??= detail;
      },
      `node ${id} payload`,
    );
    if (hit !== null) {
      throw new Error(`PII_ON_GRAPH:${hit}`);
    }
  }
}
