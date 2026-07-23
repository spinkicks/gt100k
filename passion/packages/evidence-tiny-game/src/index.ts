/**
 * Deterministic synthetic "tiny code game" student journey, built through the
 * `@gt100k/evidence-graph` public API. Pure and framework-agnostic — the only dependency is the
 * domain, so both the view/app and the Postgres seed can import it without a dependency cycle.
 *
 * The journey is a small, relatable arc: a learner plans a one-button endless runner, gets cited
 * tutor help, ships two revisions (a failing then a passing build), cites a CC0 asset, reflects,
 * releases a playable build, receives a mentor review, and is graded by a human. Pseudonymous
 * actors only, no PII. Passes `assertHumanAuthority` and the deterministic stub verifier.
 */
import {
  type EvidenceEdge,
  type EvidenceGraph,
  type EvidenceNode,
  addEdge,
  addNode,
} from "@gt100k/evidence-graph";
// `Hasher` is a port and is not re-exported from the domain index — import it via the domain's
// ports module directly (the repo's established cross-package convention).
import type { Hasher } from "../../evidence-graph/src/ports.js";

/** Stable declaration order → monotonic timestamps and stable node insertion order. */
type TinyGameKey =
  | "plan"
  | "assist-loop"
  | "artifact-v1"
  | "attempt-v1"
  | "assist-collision"
  | "artifact-v2"
  | "attempt-v2"
  | "contribution-sprite"
  | "claim-reflection"
  | "released-artifact"
  | "review-mentor"
  | "outcome-grade";

interface Seed {
  readonly key: TinyGameKey;
  readonly content: Omit<EvidenceNode, "id">;
}

const SCOPE = "project:tiny-runner-v1";

/** Monotonic timestamps in declaration order so the growth timeline is stable. */
const at = (day: number): string => `2026-05-${String(day).padStart(2, "0")}T09:00:00.000Z`;

/**
 * Pseudonymous actors. Each `ref` maps to exactly one `kind` across the whole graph so the
 * human-authority invariant can classify owners unambiguously. Model `actor.kind` appears ONLY on
 * `Assistance`/`Review` nodes; the graded `Outcome` is authored by a human.
 */
const LEARNER = { kind: "human", ref: "learner-07", displayName: "Learner" } as const;
const TUTOR = { kind: "model", ref: "tutor", displayName: "Answer-blind tutor" } as const;
const RUNNER = { kind: "system", ref: "runner-ci", displayName: "Build runner" } as const;
const RELEASE = { kind: "system", ref: "release-bot", displayName: "Release pipeline" } as const;
const MENTOR = { kind: "human", ref: "mentor-01", displayName: "Mentor" } as const;
const GRADER = { kind: "human", ref: "grader-01", displayName: "Human grader" } as const;

const SEEDS: readonly Seed[] = [
  {
    key: "plan",
    content: {
      type: "Transformation",
      actor: { ...LEARNER },
      inputs: [],
      timestamp: at(1),
      consentScope: { scope: SCOPE, purpose: "learning-record" },
      payload: { title: "Plan: build a one-button endless runner", kind: "plan" },
    },
  },
  {
    key: "assist-loop",
    content: {
      type: "Assistance",
      actor: { ...TUTOR },
      tool: { name: "tutor", version: "2.0.1" },
      inputs: [],
      timestamp: at(2),
      consentScope: { scope: SCOPE, purpose: "cited-assistance" },
      payload: { title: "Tutor: how does a game loop work?", kind: "assistance", cited: "true" },
    },
  },
  {
    key: "artifact-v1",
    content: {
      type: "Artifact",
      actor: { ...LEARNER },
      inputs: [],
      timestamp: at(3),
      consentScope: { scope: SCOPE, purpose: "learning-record" },
      payload: { title: "game.js v1 — canvas + game loop", kind: "source" },
    },
  },
  {
    key: "attempt-v1",
    content: {
      type: "Attempt",
      actor: { ...RUNNER },
      inputs: [],
      timestamp: at(4),
      consentScope: { scope: SCOPE, purpose: "build-record" },
      payload: { title: "Run v1 — player falls through floor", success: "false" },
    },
  },
  {
    key: "assist-collision",
    content: {
      type: "Assistance",
      actor: { ...TUTOR },
      tool: { name: "tutor", version: "2.0.1" },
      inputs: [],
      timestamp: at(5),
      consentScope: { scope: SCOPE, purpose: "cited-assistance" },
      payload: {
        title: "Tutor: how to add ground collision?",
        kind: "assistance",
        cited: "true",
      },
    },
  },
  {
    key: "artifact-v2",
    content: {
      type: "Artifact",
      actor: { ...LEARNER },
      inputs: [],
      timestamp: at(6),
      consentScope: { scope: SCOPE, purpose: "learning-record" },
      payload: { title: "game.js v2 — ground collision + jump", kind: "source" },
    },
  },
  {
    key: "attempt-v2",
    content: {
      type: "Attempt",
      actor: { ...RUNNER },
      inputs: [],
      timestamp: at(7),
      consentScope: { scope: SCOPE, purpose: "build-record" },
      payload: { title: "Run v2 — jump + collision pass", success: "true" },
    },
  },
  {
    key: "contribution-sprite",
    content: {
      type: "Contribution",
      actor: { ...LEARNER },
      inputs: [],
      timestamp: at(8),
      consentScope: { scope: SCOPE, purpose: "contribution-record" },
      payload: { title: "Used a CC0 sprite sheet (cited)", kind: "asset", cited: "true" },
    },
  },
  {
    key: "claim-reflection",
    content: {
      type: "Claim",
      actor: { ...LEARNER },
      inputs: [],
      timestamp: at(9),
      consentScope: { scope: SCOPE, purpose: "claim-record" },
      payload: {
        title: "Reflection: I understand the game loop and collision now",
        kind: "reflection",
      },
    },
  },
  {
    key: "released-artifact",
    content: {
      type: "Artifact",
      actor: { ...RELEASE },
      inputs: [],
      timestamp: at(10),
      consentScope: { scope: SCOPE, purpose: "release-record" },
      payload: { title: "released: playable build", kind: "release" },
    },
  },
  {
    key: "review-mentor",
    content: {
      type: "Review",
      actor: { ...MENTOR },
      inputs: [],
      timestamp: at(11),
      consentScope: { scope: SCOPE, purpose: "review-record" },
      payload: { title: "Mentor review: solid; suggests a score counter", kind: "craft" },
    },
  },
  {
    key: "outcome-grade",
    content: {
      type: "Outcome",
      actor: { ...GRADER },
      inputs: [],
      timestamp: at(12),
      consentScope: { scope: SCOPE, purpose: "grade-record" },
      payload: { title: "Shipped playable build", kind: "grade" },
    },
  },
];

/** Structural edges (§U7.1-style); `authored_by` edges are added per node from `SEEDS`. */
const STRUCTURAL_EDGES: ReadonlyArray<{
  from: TinyGameKey;
  to: TinyGameKey;
  type: EvidenceEdge["type"];
}> = [
  { from: "artifact-v1", to: "plan", type: "derived_from" },
  { from: "artifact-v1", to: "assist-loop", type: "derived_from" },
  { from: "attempt-v1", to: "artifact-v1", type: "derived_from" },
  { from: "artifact-v2", to: "artifact-v1", type: "derived_from" },
  { from: "artifact-v2", to: "assist-collision", type: "derived_from" },
  { from: "attempt-v2", to: "artifact-v2", type: "derived_from" },
  { from: "contribution-sprite", to: "artifact-v2", type: "derived_from" },
  { from: "claim-reflection", to: "attempt-v2", type: "validates" },
  { from: "attempt-v2", to: "released-artifact", type: "released_as" },
  { from: "review-mentor", to: "released-artifact", type: "validates" },
  { from: "outcome-grade", to: "released-artifact", type: "validates" },
];

export interface TinyGameBundle {
  readonly graph: EvidenceGraph;
  /** Journey key → content-addressed node id. */
  readonly ids: Record<string, string>;
  /** Stable per-project reference (one graph per project). */
  readonly projectId: string;
  /** Human-readable project name for the `projects` row. */
  readonly projectName: string;
  /** Pseudonymous student ref for the `projects` row. */
  readonly studentId: string;
  /** Content id of the released-build node this graph attests to. */
  readonly subjectDigest: string;
}

/** Count of nodes authored by this journey — asserted by tests to catch accidental drift. */
export const TINY_GAME_NODE_COUNT = SEEDS.length;

/** Build the deterministic tiny-code-game journey graph (pure, sync). */
export function buildTinyGameGraph(hasher: Hasher): TinyGameBundle {
  let graph: EvidenceGraph = { nodes: {}, edges: [] };
  const ids: Record<string, string> = {};

  // Nodes in declaration order (drives insertion order and the monotonic timeline).
  for (const seed of SEEDS) {
    const result = addNode(graph, seed.content, hasher);
    graph = result.graph;
    ids[seed.key] = result.id;
  }

  // authored_by edges (node → its actor ref), then structural edges. `addEdge` enforces the
  // DAG + no-dangling invariants, so a bad wiring throws at build time.
  for (const seed of SEEDS) {
    graph = addEdge(graph, {
      type: "authored_by",
      from: id(ids, seed.key),
      to: seed.content.actor.ref,
    });
  }
  for (const edge of STRUCTURAL_EDGES) {
    graph = addEdge(graph, { type: edge.type, from: id(ids, edge.from), to: id(ids, edge.to) });
  }

  return {
    graph,
    ids,
    projectId: "tiny-runner-v1",
    projectName: "Tiny one-button runner",
    studentId: "learner-07",
    subjectDigest: id(ids, "released-artifact"),
  };
}

/** Resolve a journey key to its built node id, failing loudly if the key was never seeded. */
function id(ids: Record<string, string>, key: TinyGameKey): string {
  const value = ids[key];
  if (value === undefined) {
    throw new Error(`TINY_GAME_MISSING_NODE:${key}`);
  }
  return value;
}
