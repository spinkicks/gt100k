import type { EvidenceEdge, EvidenceNode } from "../../src/model.js";

export type EvidenceNodeContent = Omit<EvidenceNode, "id">;

export interface SyntheticMilestoneNode {
  key: string;
  content: EvidenceNodeContent;
}

export interface SyntheticMilestoneFixture {
  milestoneRef: string;
  subjectDigest: string;
  nodes: SyntheticMilestoneNode[];
  edges: EvidenceEdge[];
  milestoneNodeKeys: string[];
  outcomeKey: string;
  islandKey: string;
}

export const goldenArtifact = {
  type: "Artifact",
  actor: { kind: "human", ref: "learner-synthetic-001" },
  tool: { name: "gt100k-editor", version: "0.1.0" },
  inputs: [],
  timestamp: "2026-01-01T00:00:00.000Z",
  consentScope: { scope: "synthetic" },
  payload: { title: "hello world" },
} satisfies EvidenceNodeContent;

export const goldenAttempt = {
  type: "Attempt",
  actor: { kind: "system", ref: "runner-synthetic-001" },
  tool: { name: "gt100k-runner", version: "0.1.0" },
  inputs: [],
  timestamp: "2026-01-01T00:05:00.000Z",
  consentScope: { scope: "synthetic" },
  payload: { success: "true" },
} satisfies EvidenceNodeContent;

export const goldenLeaves = {
  ha: "ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb",
  hb: "3e23e8160039594a33894f6564e1b1348bbd7a0088d42c4acb73eeaed59c009d",
  hc: "2e7d2c03a9507ae265ecf5b5356885a53393a2029d241394997265a1a25aefc6",
} as const;

const transformationPlan = {
  type: "Transformation",
  actor: { kind: "human", ref: "learner-synthetic-001" },
  tool: { name: "gt100k-planner", version: "0.1.0" },
  inputs: [],
  timestamp: "2026-01-01T00:02:00.000Z",
  consentScope: { scope: "synthetic" },
  payload: { kind: "plan", objective: "transform the synthetic artifact" },
} satisfies EvidenceNodeContent;

const declaredAssistance = {
  type: "Assistance",
  actor: { kind: "model", ref: "assistant-model-synthetic" },
  tool: { name: "synthetic-assistant", version: "0.1.0" },
  inputs: [],
  timestamp: "2026-01-01T00:06:00.000Z",
  consentScope: { scope: "synthetic" },
  payload: {
    kind: "declared-assistance",
    assistingActorRef: "assistant-model-synthetic",
    affectedArtifactRef: "artifact",
  },
} satisfies EvidenceNodeContent;

const humanReview = {
  type: "Review",
  actor: { kind: "human", ref: "reviewer-synthetic-001" },
  tool: { name: "gt100k-review", version: "0.1.0" },
  inputs: [],
  timestamp: "2026-01-01T00:07:00.000Z",
  consentScope: { scope: "synthetic" },
  payload: { kind: "review", verdict: "accepted" },
} satisfies EvidenceNodeContent;

const learnerContribution = {
  type: "Contribution",
  actor: { kind: "human", ref: "learner-synthetic-001" },
  inputs: [],
  timestamp: "2026-01-01T00:08:00.000Z",
  consentScope: { scope: "synthetic" },
  payload: { kind: "contribution", role: "author" },
} satisfies EvidenceNodeContent;

const humanOwnedOutcome = {
  type: "Outcome",
  actor: { kind: "human", ref: "reviewer-synthetic-001" },
  inputs: [],
  timestamp: "2026-01-01T00:09:00.000Z",
  consentScope: { scope: "synthetic" },
  payload: { kind: "grade", value: "meets-expectations", rubricRef: "rubric-synthetic-001" },
} satisfies EvidenceNodeContent;

const unrelatedIsland = {
  type: "Claim",
  actor: { kind: "human", ref: "learner-synthetic-001" },
  inputs: [],
  timestamp: "2026-01-01T00:10:00.000Z",
  consentScope: { scope: "synthetic" },
  payload: { kind: "claim", statement: "unrelated synthetic claim" },
} satisfies EvidenceNodeContent;

export const syntheticMilestone = {
  milestoneRef: "milestone-synthetic-001",
  subjectDigest: "fa6cc759cb3564394df561e6d4d2e9fe9ad76568ee10e37d22a83539bc3f6958",
  nodes: [
    { key: "artifact", content: goldenArtifact },
    { key: "transformation-plan", content: transformationPlan },
    { key: "attempt-run", content: goldenAttempt },
    { key: "assistance-declared", content: declaredAssistance },
    { key: "review-human", content: humanReview },
    { key: "contribution-learner", content: learnerContribution },
    { key: "outcome-grade", content: humanOwnedOutcome },
    { key: "claim-unrelated-island", content: unrelatedIsland },
  ],
  edges: [
    { type: "derived_from", from: "transformation-plan", to: "artifact" },
    { type: "authored_by", from: "transformation-plan", to: "learner-synthetic-001" },
    { type: "used_tool", from: "transformation-plan", to: "gt100k-planner" },
    { type: "derived_from", from: "attempt-run", to: "transformation-plan" },
    { type: "used_tool", from: "attempt-run", to: "gt100k-runner" },
    { type: "derived_from", from: "assistance-declared", to: "attempt-run" },
    { type: "authored_by", from: "assistance-declared", to: "assistant-model-synthetic" },
    { type: "validates", from: "review-human", to: "assistance-declared" },
    { type: "authored_by", from: "review-human", to: "reviewer-synthetic-001" },
    { type: "derived_from", from: "contribution-learner", to: "review-human" },
    { type: "authored_by", from: "contribution-learner", to: "learner-synthetic-001" },
    { type: "released_as", from: "contribution-learner", to: "outcome-grade" },
    { type: "authored_by", from: "outcome-grade", to: "reviewer-synthetic-001" },
  ],
  milestoneNodeKeys: [
    "artifact",
    "transformation-plan",
    "attempt-run",
    "assistance-declared",
    "review-human",
    "contribution-learner",
    "outcome-grade",
  ],
  outcomeKey: "outcome-grade",
  islandKey: "claim-unrelated-island",
} satisfies SyntheticMilestoneFixture;
