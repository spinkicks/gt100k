/**
 * Test builders. A `cleanMap()` that passes every rule, plus overrides, so each test states only
 * the one thing it is about. Deliberately in src/ rather than test/ so the stub generator and the
 * golden fixtures can share them.
 *
 * SYNTHETIC ONLY. No real child, no real map.
 */
import type { CuratedResource } from "@gt100k/concierge";
import type { MasteryMap, Milestone } from "../model.js";

const RESOURCE: CuratedResource = {
  id: "res-1",
  title: "A worked introduction",
  url: "https://example.org/intro",
  domainPath: ["games-strategy"],
  affordedModes: ["investigate"],
  reputation: 0.9,
  ageTiers: ["6-8"],
  provenance: "sha256:0000",
};

/**
 * A milestone that passes every error rule. `capability` deliberately shares a content word with
 * `demonstration` ("annotation"), which is what error 3 checks.
 */
export function milestone(over: Partial<Milestone> = {}): Milestone {
  return {
    id: "m1",
    title: "Read a position",
    capability: "Produce an annotation of a finished game",
    requires: [],
    modes: [],
    stageFloor: "S1_IGNITION",
    ordering: {
      reason: "Reading a position comes before choosing between positions.",
      basis: "model",
      sources: [],
    },
    resources: [RESOURCE],
    practice: [
      { title: "Study a position alone", description: "Sit with one position.", solitary: true },
    ],
    demonstration: "A written annotation",
    opportunities: [],
    authorship: "model",
    ...over,
  };
}

/** A map that passes every error rule. Trunk-only, so it is reachable by a real child today. */
export function cleanMap(over: Partial<MasteryMap> = {}): MasteryMap {
  return {
    id: "map-clean",
    version: 1,
    domainPath: ["games-strategy"],
    modes: ["investigate", "build"],
    ageBands: ["6-8"],
    milestones: [milestone()],
    provenance: {
      model: "stub",
      promptVersion: "v0",
      generatedAt: "2026-07-26T00:00:00.000Z",
      edits: [],
    },
    validation: {
      validatedAt: "2026-07-26T00:00:00.000Z",
      validatorVersion: "v0",
      errors: [],
      warnings: [],
    },
    status: "draft",
    vettedBy: null,
    vettedAt: null,
    revalidatedAt: "2026-07-26T00:00:00.000Z",
    ...over,
  };
}

/** `cleanMap` with these milestones instead of the default one. */
export function withMilestones(...milestones: readonly Milestone[]): MasteryMap {
  return cleanMap({ milestones });
}
