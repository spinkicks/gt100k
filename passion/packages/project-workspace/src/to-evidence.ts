// `toEvidence` — the PURE §4.3 mapping from a child's work-events onto the CLOSED EvidenceGraph
// taxonomy (`@gt100k/evidence-graph`). It folds the append-only journey through `addNode`/`addEdge`,
// giving each kind its mandated `NodeType`, `actor.kind` and edges. It is the SINGLE source of the
// mapping: the stub sink and the real `@gt100k/evidence-sink-graph` adapter both call it and only
// swap the injected `Hasher`. Deterministic, offline, no gamification — declared AI help is a
// NEUTRAL `Assistance` node (never penalized), and graded Outcomes are never produced here (D2 does
// not score). The graph rejects unknown node/edge types, so an invalid mapping fails loudly.
import { addEdge, addNode } from "@gt100k/evidence-graph";
import type {
  ActorRef,
  EvidenceEdge,
  EvidenceGraph,
  EvidenceNode,
  NodeType,
  ToolRef,
} from "@gt100k/evidence-graph";

import type { Project, WorkEvent, WorkEventKind } from "./model.js";
import type { Hasher } from "./sink.js";

/** §4.3: each kid entry maps to exactly one closed `NodeType`. */
const NODE_TYPE_BY_KIND = {
  session: "Contribution",
  attempt: "Attempt",
  outcome: "Outcome",
  revision: "Transformation",
  artifact: "Artifact",
  decision: "Claim",
  reflection: "Claim",
  ai_help: "Assistance",
  milestone: "Outcome",
  showcase: "Review",
} as const satisfies Record<WorkEventKind, NodeType>;

/** Kinds the child directly authors — get an `authored_by` edge to the child actor (§4.3). */
const AUTHORED_BY_CHILD: ReadonlySet<WorkEventKind> = new Set<WorkEventKind>([
  "session",
  "attempt",
  "artifact",
  "decision",
  "reflection",
]);

/** Kinds that build on prior events — get a `derived_from` edge to each resolved ref (§4.3). */
const DERIVED_FROM_REFS: ReadonlySet<WorkEventKind> = new Set<WorkEventKind>([
  "outcome",
  "revision",
  "artifact",
  "milestone",
]);

const CONSENT_SCOPE = { scope: "synthetic", purpose: "project-studio" } as const;

/** The actor for an event: the child (human), the declared AI (model), or the studio (system). */
function actorFor(project: Project, event: WorkEvent): ActorRef {
  if (event.kind === "ai_help") {
    return { kind: "model", ref: `model:${event.aiTool?.name ?? "declared-ai"}` };
  }
  if (event.kind === "showcase") {
    return { kind: "system", ref: "system:project-studio" };
  }
  return { kind: "human", ref: `child:${project.kidId}` };
}

/**
 * Fold a project's events onto the closed EvidenceGraph taxonomy per §4.3, using the injected
 * `hasher` for content-addressed node ids. The source event id is carried in the node payload so
 * every event maps to a distinct node (content-addressing then keeps identical projects identical).
 */
export function toEvidence(project: Project, hasher: Hasher): EvidenceGraph {
  let graph: EvidenceGraph = { nodes: {}, edges: [] };
  const nodeIdByEventId = new Map<string, string>();

  for (const event of project.events) {
    const type = NODE_TYPE_BY_KIND[event.kind];
    const actor = actorFor(project, event);

    // Resolve refs to already-built node ids (unknown refs are dropped — provenance stays sound).
    const inputs = (event.refs ?? [])
      .map((ref) => nodeIdByEventId.get(ref))
      .filter((id): id is string => id !== undefined);

    const payload: Record<string, unknown> = {
      kind: event.kind,
      text: event.text,
      sourceEventId: event.id,
    };
    if (event.stuck !== undefined) {
      payload.stuck = event.stuck;
    }
    if (event.artifact !== undefined) {
      payload.artifact = event.artifact;
    }

    const tool: ToolRef | undefined =
      event.kind === "ai_help" && event.aiTool !== undefined
        ? { name: event.aiTool.name, version: event.aiTool.version }
        : undefined;

    const content: Omit<EvidenceNode, "id"> = {
      type,
      actor,
      ...(tool !== undefined ? { tool } : {}),
      inputs,
      timestamp: event.at,
      consentScope: { ...CONSENT_SCOPE },
      payload,
    };

    const added = addNode(graph, content, hasher);
    graph = added.graph;
    const nodeId = added.id;
    nodeIdByEventId.set(event.id, nodeId);

    const edges: EvidenceEdge[] = [];

    if (AUTHORED_BY_CHILD.has(event.kind)) {
      edges.push({ type: "authored_by", from: nodeId, to: actor.ref });
    }

    if (DERIVED_FROM_REFS.has(event.kind)) {
      for (const inputId of inputs) {
        edges.push({ type: "derived_from", from: nodeId, to: inputId });
      }
    }

    if (event.kind === "outcome") {
      // A stuck outcome CONTRADICTS its attempt; a working one VALIDATES it (§4.2 / §4.3).
      const relation = event.stuck === true ? "contradicts" : "validates";
      for (const inputId of inputs) {
        edges.push({ type: relation, from: nodeId, to: inputId });
      }
    }

    if (tool !== undefined) {
      // Declared AI help: a NEUTRAL Assistance node records which tool was used.
      edges.push({ type: "used_tool", from: nodeId, to: tool.name });
    }

    if (event.kind === "showcase") {
      // The referenced artifact is released_as the showcase and the showcase validates it. Both
      // edges point INTO the showcase (artifact → Review) so the graph stays a DAG.
      for (const inputId of inputs) {
        edges.push({ type: "released_as", from: inputId, to: nodeId });
        edges.push({ type: "validates", from: inputId, to: nodeId });
      }
    }

    for (const edge of edges) {
      graph = addEdge(graph, edge);
    }
  }

  return graph;
}
