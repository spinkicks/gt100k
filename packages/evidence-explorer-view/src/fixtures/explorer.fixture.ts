/**
 * Committed synthetic fixture — the canonical "speaker-v1" milestone (§U7), built through the
 * `@gt100k/evidence-graph` public API. Pseudonymous actors, no PII, no consent/admissions/legal
 * machinery. 13 nodes (12 in-milestone + 1 disconnected island), assembled into an `EvidencePacket`
 * that passes the human-authority invariant and the deterministic stub verifier.
 */
import {
  addEdge,
  addNode,
  assembleEvidencePacket,
  type EvidenceEdge,
  type EvidenceGraph,
  type EvidenceNode,
  type EvidencePacket,
  type VerificationResult,
} from "@gt100k/evidence-graph";
// `Hasher` is a port and is not re-exported from the domain index — import it via the domain's
// ports module directly (the repo's established cross-package convention).
import type { Hasher } from "../../../evidence-graph/src/ports.js";
import { DeterministicStubVerifier } from "@gt100k/evidence-verifier-stub";

/** Stable declaration order — drives within-rank layout order (§U8.1/§U8.2). */
type FixtureKey =
  | "plan"
  | "assist-research"
  | "assist-tutor"
  | "src-artifact"
  | "attempt-1"
  | "attempt-2"
  | "claim-repro"
  | "review-technical"
  | "released-artifact"
  | "contribution-self"
  | "review-craft"
  | "outcome-grade"
  | "island-note";

interface Seed {
  readonly key: FixtureKey;
  readonly content: Omit<EvidenceNode, "id">;
  /** Milestone membership (island excluded from the packet). */
  readonly milestone: boolean;
}

/** Monotonic timestamps in declaration order so the growth timeline is stable (§U8.7). */
const at = (day: number): string =>
  `2026-03-${String(day).padStart(2, "0")}T09:00:00.000Z`;

const SEEDS: readonly Seed[] = [
  {
    key: "plan",
    milestone: true,
    content: {
      type: "Transformation",
      actor: { kind: "human", ref: "learner-01", displayName: "Learner" },
      inputs: [],
      timestamp: at(1),
      consentScope: { scope: "milestone:speaker-v1", purpose: "learning-record" },
      payload: { title: "Declared plan", kind: "plan" },
    },
  },
  {
    key: "assist-research",
    milestone: true,
    content: {
      type: "Assistance",
      actor: { kind: "model", ref: "model-retrieval", displayName: "Research assistant" },
      tool: { name: "retrieval", version: "1.4.0" },
      inputs: [],
      timestamp: at(2),
      consentScope: { scope: "milestone:speaker-v1", purpose: "cited-assistance" },
      payload: { title: "Cited research retrieval", kind: "assistance" },
    },
  },
  {
    key: "assist-tutor",
    milestone: true,
    content: {
      type: "Assistance",
      actor: { kind: "model", ref: "model-tutor", displayName: "Answer-blind tutor" },
      tool: { name: "tutor", version: "2.0.1" },
      inputs: [],
      timestamp: at(3),
      consentScope: { scope: "milestone:speaker-v1", purpose: "cited-assistance" },
      payload: { title: "Answer-blind tutor hint", kind: "assistance" },
    },
  },
  {
    key: "src-artifact",
    milestone: true,
    content: {
      type: "Artifact",
      actor: { kind: "human", ref: "learner-01", displayName: "Learner" },
      inputs: [],
      timestamp: at(4),
      consentScope: { scope: "milestone:speaker-v1", purpose: "learning-record" },
      payload: { title: "Source design files", kind: "source" },
    },
  },
  {
    key: "attempt-1",
    milestone: true,
    content: {
      type: "Attempt",
      actor: { kind: "system", ref: "runner-ci", displayName: "Build runner" },
      inputs: [],
      timestamp: at(5),
      consentScope: { scope: "milestone:speaker-v1", purpose: "build-record" },
      payload: { title: "First build run", success: "false" },
    },
  },
  {
    key: "attempt-2",
    milestone: true,
    content: {
      type: "Attempt",
      actor: { kind: "system", ref: "runner-ci", displayName: "Build runner" },
      inputs: [],
      timestamp: at(6),
      consentScope: { scope: "milestone:speaker-v1", purpose: "build-record" },
      payload: { title: "Revision run", success: "true" },
    },
  },
  {
    key: "claim-repro",
    milestone: true,
    content: {
      type: "Claim",
      actor: { kind: "human", ref: "learner-01", displayName: "Learner" },
      inputs: [],
      timestamp: at(7),
      consentScope: { scope: "milestone:speaker-v1", purpose: "claim-record" },
      payload: { title: "Hermetic-reproduction claim", kind: "reproduction" },
    },
  },
  {
    key: "review-technical",
    milestone: true,
    content: {
      type: "Review",
      actor: { kind: "human", ref: "reviewer-tech", displayName: "Technical reviewer" },
      inputs: [],
      timestamp: at(8),
      consentScope: { scope: "milestone:speaker-v1", purpose: "review-record" },
      payload: { title: "Technical review", kind: "technical" },
    },
  },
  {
    key: "released-artifact",
    milestone: true,
    content: {
      type: "Artifact",
      actor: { kind: "system", ref: "release-bot", displayName: "Release pipeline" },
      inputs: [],
      timestamp: at(9),
      consentScope: { scope: "milestone:speaker-v1", purpose: "release-record" },
      payload: { title: "Released speaker design v1", kind: "release" },
    },
  },
  {
    key: "contribution-self",
    milestone: true,
    content: {
      type: "Contribution",
      actor: { kind: "human", ref: "learner-01", displayName: "Learner" },
      inputs: [],
      timestamp: at(10),
      consentScope: { scope: "milestone:speaker-v1", purpose: "contribution-record" },
      payload: { title: "Learner contribution", kind: "self" },
    },
  },
  {
    key: "review-craft",
    milestone: true,
    content: {
      type: "Review",
      actor: { kind: "human", ref: "mentor-craft", displayName: "Craft mentor" },
      inputs: [],
      timestamp: at(11),
      consentScope: { scope: "milestone:speaker-v1", purpose: "review-record" },
      payload: { title: "Craft-mentor review", kind: "craft" },
    },
  },
  {
    key: "outcome-grade",
    milestone: true,
    content: {
      type: "Outcome",
      actor: { kind: "human", ref: "grader-01", displayName: "Human grader" },
      inputs: [],
      timestamp: at(12),
      consentScope: { scope: "milestone:speaker-v1", purpose: "grade-record" },
      payload: { title: "Final grade", kind: "grade" },
    },
  },
  {
    key: "island-note",
    milestone: false,
    content: {
      type: "Claim",
      actor: { kind: "human", ref: "learner-01", displayName: "Learner" },
      inputs: [],
      timestamp: at(13),
      consentScope: { scope: "note:private", purpose: "unrelated" },
      payload: { title: "Unrelated island note", kind: "note" },
    },
  },
];

/** Milestone edges (§U7.1); actor `authored_by` edges are added per node from `SEEDS`. */
const MILESTONE_EDGES: ReadonlyArray<{ from: FixtureKey; to: FixtureKey; type: EvidenceEdge["type"] }> = [
  { from: "src-artifact", to: "plan", type: "derived_from" },
  { from: "src-artifact", to: "assist-research", type: "derived_from" },
  { from: "attempt-1", to: "src-artifact", type: "derived_from" },
  { from: "attempt-1", to: "assist-tutor", type: "derived_from" },
  { from: "attempt-2", to: "attempt-1", type: "derived_from" },
  { from: "attempt-2", to: "src-artifact", type: "derived_from" },
  { from: "claim-repro", to: "attempt-2", type: "validates" },
  { from: "review-technical", to: "attempt-2", type: "validates" },
  { from: "attempt-2", to: "released-artifact", type: "released_as" },
  { from: "contribution-self", to: "attempt-2", type: "derived_from" },
  { from: "review-craft", to: "released-artifact", type: "validates" },
  { from: "outcome-grade", to: "released-artifact", type: "validates" },
];

export interface FixtureBundle {
  readonly graph: EvidenceGraph;
  readonly packet: EvidencePacket;
  /** Fixture key → content-addressed node id. */
  readonly ids: Record<FixtureKey, string>;
}

/** Build the synthetic graph + assembled packet deterministically (pure, sync). */
export function buildFixtureGraph(hasher: Hasher): FixtureBundle {
  let graph: EvidenceGraph = { nodes: {}, edges: [] };
  const ids = {} as Record<FixtureKey, string>;

  // Nodes in declaration order (drives insertion order → within-rank layout order).
  for (const seed of SEEDS) {
    const result = addNode(graph, seed.content, hasher);
    graph = result.graph;
    ids[seed.key] = result.id;
  }

  // authored_by edges (node → its actor ref), then milestone structural edges.
  for (const seed of SEEDS) {
    graph = addEdge(graph, {
      type: "authored_by",
      from: ids[seed.key],
      to: seed.content.actor.ref,
    });
  }
  for (const e of MILESTONE_EDGES) {
    graph = addEdge(graph, { type: e.type, from: ids[e.from], to: ids[e.to] });
  }

  const nodeIds = SEEDS.filter((s) => s.milestone).map((s) => ids[s.key]);
  const packet = assembleEvidencePacket(
    graph,
    {
      milestoneRef: "speaker-v1",
      subjectDigest: ids["released-artifact"],
      nodeIds,
    },
    hasher,
  );

  return { graph, packet, ids };
}

export interface ExplorerFixture extends FixtureBundle {
  readonly verifierResult: VerificationResult;
}

/** Full fixture including the deterministic stub-verifier result (§U7). */
export async function explorerFixture(hasher: Hasher): Promise<ExplorerFixture> {
  const bundle = buildFixtureGraph(hasher);
  const verifierResult = await new DeterministicStubVerifier().verify(bundle.packet, hasher);
  return { ...bundle, verifierResult };
}

/**
 * Deterministically tamper the released byte-body's payload. The committed packet is unchanged, so
 * the mismatch surfaces at verify time when node hashes are re-derived from content (§U8.8, U3).
 */
export function applyTamper(bundle: FixtureBundle): FixtureBundle {
  const targetId = bundle.ids["released-artifact"];
  const target = bundle.graph.nodes[targetId];
  const tamperedNodes = { ...bundle.graph.nodes };
  if (target !== undefined) {
    tamperedNodes[targetId] = {
      ...target,
      payload: { ...target.payload, title: "Tampered released artifact", tampered: true },
    };
  }
  return {
    graph: { nodes: tamperedNodes, edges: bundle.graph.edges },
    packet: bundle.packet,
    ids: bundle.ids,
  };
}
