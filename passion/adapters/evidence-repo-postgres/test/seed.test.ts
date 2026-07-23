// @vitest-environment node
import { describe, expect, it } from "vitest";

import { graphMerkleRoot } from "../../../packages/evidence-graph/src/index.js";
import { NodeCryptoHasher } from "../../evidence-hash-node/src/index.js";
import { DeterministicStubVerifier } from "../../evidence-verifier-stub/src/index.js";
import { createPgliteRepository } from "../src/index.js";
import { seedTinyGame } from "../src/seed.js";

const hasher = new NodeCryptoHasher();

describe("seedTinyGame", () => {
  it("is idempotent — seeding twice yields the same root and exactly one project", async () => {
    const { repo } = await createPgliteRepository();

    const first = await seedTinyGame(repo, hasher);
    const second = await seedTinyGame(repo, hasher);

    expect(second.root).toBe(first.root);
    expect(second.projectId).toBe("tiny-runner-v1");

    const projects = await repo.listProjects();
    expect(projects).toHaveLength(1);
    expect(projects[0]?.id).toBe("tiny-runner-v1");
  });

  it("round-trips the persisted graph and verifies after seeding", async () => {
    const { repo } = await createPgliteRepository();
    const { projectId, root } = await seedTinyGame(repo, hasher);

    const graph = await repo.getGraph(projectId);
    expect(graph).not.toBeNull();
    if (graph === null) throw new Error("graph missing");

    // Byte-identical reconstruction: reloaded graph hashes to the same Merkle root.
    expect(graphMerkleRoot(graph, hasher)).toBe(root);

    const verification = await new DeterministicStubVerifier().verify(graph, hasher);
    expect(verification.ok).toBe(true);
    expect(verification.reasons).toEqual([]);
  });

  it("persists a project row with the builder's name and student", async () => {
    const { repo } = await createPgliteRepository();
    const { projectId } = await seedTinyGame(repo, hasher);

    const project = await repo.getProject(projectId);
    expect(project?.name).toBe("Tiny one-button runner");
    expect(project?.studentId).toBe("learner-07");
  });
});
