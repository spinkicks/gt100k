import type {
  ActorKind,
  EvidenceGraph,
  EvidenceNode,
  NodeType,
  VerificationResult,
} from "./model.js";

const HUMAN_OWNED_OUTCOME_KINDS = new Set(["grade", "judgment"]);
const MODEL_AUTHORED_NODE_TYPES = new Set<NodeType>(["Assistance", "Review"]);

function actorKindsByRef(nodes: EvidenceNode[]): Map<string, Set<ActorKind>> {
  const kindsByRef = new Map<string, Set<ActorKind>>();

  for (const node of nodes) {
    const kinds = kindsByRef.get(node.actor.ref) ?? new Set<ActorKind>();
    kinds.add(node.actor.kind);
    kindsByRef.set(node.actor.ref, kinds);
  }

  return kindsByRef;
}

function isUnambiguousHuman(ref: string, kindsByRef: Map<string, Set<ActorKind>>): boolean {
  const kinds = kindsByRef.get(ref);
  return ref.trim().length > 0 && kinds?.size === 1 && kinds.has("human");
}

function containsAuthorshipAccusation(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.some(containsAuthorshipAccusation);
  }
  if (value === null || typeof value !== "object") {
    return false;
  }

  return Object.entries(value).some(
    ([key, nested]) =>
      (key === "kind" && nested === "authorshipAccusation") || containsAuthorshipAccusation(nested),
  );
}

/** Validates the constitutional human-authority and no-accusation rules without mutating the graph. */
export function assertHumanAuthority(graph: EvidenceGraph): VerificationResult {
  const nodes = Object.values(graph.nodes);
  const kindsByRef = actorKindsByRef(nodes);
  const reasons = new Set<string>();

  for (const node of nodes) {
    const attributions = graph.edges.filter(
      (edge) => edge.type === "authored_by" && edge.from === node.id,
    );
    const hasHumanOwner = attributions.some((edge) => isUnambiguousHuman(edge.to, kindsByRef));
    const hasModelAuthor =
      node.actor.kind === "model" ||
      attributions.some((edge) => kindsByRef.get(edge.to)?.has("model") === true);

    if (node.type === "Outcome" && HUMAN_OWNED_OUTCOME_KINDS.has(node.payload.kind as string)) {
      if (hasModelAuthor) {
        reasons.add("MODEL_OWNED_GRADE");
      } else if (!hasHumanOwner) {
        reasons.add("HUMAN_OWNER_REQUIRED");
      }
    }

    if (hasModelAuthor && !MODEL_AUTHORED_NODE_TYPES.has(node.type)) {
      reasons.add("MODEL_AUTHORED_PROHIBITED_TYPE");
    }

    if (containsAuthorshipAccusation(node.payload)) {
      reasons.add("AUTHORSHIP_ACCUSATION");
    }
  }

  if (graph.edges.some((edge) => edge.label === "authorshipAccusation")) {
    reasons.add("AUTHORSHIP_ACCUSATION");
  }

  return { ok: reasons.size === 0, reasons: [...reasons] };
}
