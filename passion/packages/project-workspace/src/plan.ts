// `toEvidencePlan` — the PURE §4.3 mapping from a child's work-events onto the CLOSED EvidenceGraph
// taxonomy. It decides, for each quest entry, which `NodeType` it becomes, who the actor is, and
// which edges it earns. It is the SINGLE source of that mapping.
//
// WHAT IT DELIBERATELY DOES NOT DO: build a graph. The `@gt100k/evidence-*` packages are a SEPARATE
// PRODUCT intended for extraction as a mechanical copy (`docs/decisions/evidencegraph-v1-design.md`
// §11/§13a), and nothing outside that namespace may import a VALUE from inside it. This file used to
// call `addNode`/`addEdge` directly, which quietly made the passion domain depend on the graph's
// runtime and put a product boundary in the middle of a fold.
//
// So the split is: the MAPPING is passion-domain knowledge and lives here; the MATERIALIZATION
// (content-addressing, DAG validation) is graph knowledge and lives in
// `@gt100k/project-evidence-sink`, the one adapter allowed to know both sides. This file emits a
// plan — pure data — and the adapter turns it into an `EvidenceGraph`.
//
// Types still cross the boundary, on purpose: `NodeType`/`EdgeType` keep the `satisfies` check below
// honest, so an entry kind mapped to a node type the graph does not have fails the BUILD rather than
// at runtime. Types vanish at compile time, so they cost nothing on extraction.
//
// Deterministic, offline, no gamification — declared AI help is a NEUTRAL `Assistance` node (never
// penalized), and graded Outcomes are never produced here (D2 does not score).
import type { ActorRef, EdgeType, NodeType, ToolRef } from "@gt100k/evidence-graph";

import type { Project, WorkEvent, WorkEventKind } from "./model.js";

/**
 * A reference inside a plan, which cannot use node ids because those are content-addressed and do not
 * exist until the adapter hashes each node.
 *
 * - `event` — "the node this work-event becomes". The adapter resolves it once it has hashed that node.
 * - `literal` — a target that was never a node id to begin with: an `authored_by` edge points at an
 *   `actor.ref` and a `used_tool` edge at a `tool.name`. The graph's own edge-target resolution
 *   accepts all three forms, and conflating them here would corrupt the two that are already final.
 */
export type PlanRef =
  | { readonly kind: "event"; readonly eventId: string }
  | { readonly kind: "literal"; readonly ref: string };

/** One planned node: everything about it except the content-addressed id the adapter assigns. */
export interface PlannedNode {
  /** The source work-event. Also the plan-local handle a `PlanRef` of kind `event` points at. */
  readonly eventId: string;
  readonly type: NodeType;
  readonly actor: ActorRef;
  readonly tool?: ToolRef;
  /** Earlier events this one builds on, by event id. The adapter maps these to node ids. */
  readonly inputEventIds: readonly string[];
  readonly timestamp: string;
  readonly consentScope: { readonly scope: string; readonly purpose: string };
  readonly payload: Readonly<Record<string, unknown>>;
}

/** One planned edge. Both ends are `PlanRef`s for the reason given on `PlanRef`. */
export interface PlannedEdge {
  readonly type: EdgeType;
  readonly from: PlanRef;
  readonly to: PlanRef;
}

/**
 * A complete, materialization-ready description of a project's provenance — pure data, no hashing and
 * no graph. `nodes` is in journey order and `edges` is in the order the fold produced them, so an
 * adapter that walks both in order reproduces exactly the sequence the old in-place fold performed.
 */
export interface EvidencePlan {
  readonly nodes: readonly PlannedNode[];
  readonly edges: readonly PlannedEdge[];
}

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
function actorFor(project: Project, workEvent: WorkEvent): ActorRef {
  if (workEvent.kind === "ai_help") {
    return { kind: "model", ref: `model:${workEvent.aiTool?.name ?? "declared-ai"}` };
  }
  if (workEvent.kind === "showcase") {
    return { kind: "system", ref: "system:project-studio" };
  }
  return { kind: "human", ref: `child:${project.kidId}` };
}

const eventRef = (eventId: string): PlanRef => ({ kind: "event", eventId });
const literalRef = (ref: string): PlanRef => ({ kind: "literal", ref });

/**
 * Map a project's events onto the closed EvidenceGraph taxonomy per §4.3, as a plan.
 *
 * Journey order is load-bearing: a ref is resolved only against events ALREADY SEEN, so a reference
 * forward in time (or to nothing at all) is dropped rather than honoured. That keeps provenance
 * sound — an event cannot derive from work that had not happened yet — and it is why this is a fold
 * over the events rather than two passes.
 */
export function toEvidencePlan(project: Project): EvidencePlan {
  const nodes: PlannedNode[] = [];
  const edges: PlannedEdge[] = [];
  const seenEventIds = new Set<string>();

  for (const workEvent of project.events) {
    const type = NODE_TYPE_BY_KIND[workEvent.kind];
    const actor = actorFor(project, workEvent);

    // Resolve refs against events already folded (unknown or forward refs are dropped).
    const inputEventIds = (workEvent.refs ?? []).filter((ref) => seenEventIds.has(ref));

    const payload: Record<string, unknown> = {
      kind: workEvent.kind,
      text: workEvent.text,
      sourceEventId: workEvent.id,
    };
    if (workEvent.stuck !== undefined) {
      payload.stuck = workEvent.stuck;
    }
    if (workEvent.artifact !== undefined) {
      payload.artifact = workEvent.artifact;
    }

    const tool: ToolRef | undefined =
      workEvent.kind === "ai_help" && workEvent.aiTool !== undefined
        ? { name: workEvent.aiTool.name, version: workEvent.aiTool.version }
        : undefined;

    nodes.push({
      eventId: workEvent.id,
      type,
      actor,
      ...(tool !== undefined ? { tool } : {}),
      inputEventIds,
      timestamp: workEvent.at,
      consentScope: { ...CONSENT_SCOPE },
      payload,
    });

    // The node exists from here on, so a LATER event may reference it. Set after computing this
    // event's own inputs, so a self-referencing ref stays excluded.
    seenEventIds.add(workEvent.id);

    if (AUTHORED_BY_CHILD.has(workEvent.kind)) {
      edges.push({ type: "authored_by", from: eventRef(workEvent.id), to: literalRef(actor.ref) });
    }

    if (DERIVED_FROM_REFS.has(workEvent.kind)) {
      for (const inputId of inputEventIds) {
        edges.push({ type: "derived_from", from: eventRef(workEvent.id), to: eventRef(inputId) });
      }
    }

    if (workEvent.kind === "outcome") {
      // A stuck outcome CONTRADICTS its attempt; a working one VALIDATES it (§4.2 / §4.3).
      const relation: EdgeType = workEvent.stuck === true ? "contradicts" : "validates";
      for (const inputId of inputEventIds) {
        edges.push({ type: relation, from: eventRef(workEvent.id), to: eventRef(inputId) });
      }
    }

    if (tool !== undefined) {
      // Declared AI help: a NEUTRAL Assistance node records which tool was used.
      edges.push({ type: "used_tool", from: eventRef(workEvent.id), to: literalRef(tool.name) });
    }

    if (workEvent.kind === "showcase") {
      // The referenced artifact is released_as the showcase and the showcase validates it. Both
      // edges point INTO the showcase (artifact → Review) so the graph stays a DAG.
      for (const inputId of inputEventIds) {
        edges.push({ type: "released_as", from: eventRef(inputId), to: eventRef(workEvent.id) });
        edges.push({ type: "validates", from: eventRef(inputId), to: eventRef(workEvent.id) });
      }
    }
  }

  return { nodes, edges };
}
