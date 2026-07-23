import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { NodeCryptoHasher } from "@gt100k/evidence-hash-node";
import {
  InMemoryBlobStore,
  PostgresEvidenceRepository,
  createPgliteRepository,
  ensureSchema,
} from "@gt100k/evidence-repo-postgres";
import { TINY_GAME_NODE_COUNT, buildTinyGameGraph } from "@gt100k/evidence-tiny-game";
import { afterAll, describe, expect, it } from "vitest";
import type { AddNodeInput } from "../components/manual-add.js";
import { addEdgeVia, addNodeVia, loadProjectFrom, resetVia } from "../components/project-store.js";

/**
 * P3b persistent-store core. These exercise the repo-taking read-modify-write functions against an
 * ephemeral in-memory pglite repo (fast, isolated per test), plus one on-disk round-trip that opens
 * the SAME dataDir in a fresh PGlite instance to prove writes survive a process restart.
 */
const hasher = new NodeCryptoHasher();

const nodeInput = (over: Partial<AddNodeInput> = {}): AddNodeInput => ({
  type: "Claim",
  title: "Manual reflection",
  actorKind: "human",
  actorRef: "learner-07",
  timestamp: "2026-07-24T00:00:00.000Z",
  ...over,
});

describe("loadProjectFrom", () => {
  it("auto-seeds the project on first load and returns a populated bundle", async () => {
    const { repo } = await createPgliteRepository();
    const seed = await loadProjectFrom(repo, hasher);

    expect(Object.keys(seed.graph.nodes).length).toBe(TINY_GAME_NODE_COUNT);
    expect(seed.projectRef).toBe("tiny-runner-v1");
    // The subject (released artifact) node must be present and verifiable.
    expect(seed.graph.nodes[seed.subjectDigest]).toBeDefined();
    // The honest seed verifies; the tampered variant does not (the Verify/Tamper demo still works).
    expect(seed.verification.verified.sealState).toBe("verified");
    expect(seed.verification.tampered.sealState).toBe("mismatch");

    // Idempotent: a second load does not re-seed / grow the graph.
    const again = await loadProjectFrom(repo, hasher);
    expect(Object.keys(again.graph.nodes).length).toBe(TINY_GAME_NODE_COUNT);
  });
});

describe("addNodeVia", () => {
  it("persists a manual node — a re-read from the store shows it", async () => {
    const { repo } = await createPgliteRepository();
    await loadProjectFrom(repo, hasher);
    const before = TINY_GAME_NODE_COUNT;

    const result = await addNodeVia(repo, hasher, nodeInput({ title: "A persisted claim" }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(Object.keys(result.seed.graph.nodes).length).toBe(before + 1);

    // Re-read straight from the repo (not the returned bundle) to prove it was written.
    const persisted = await repo.getGraph("tiny-runner-v1");
    expect(persisted).not.toBeNull();
    expect(Object.keys(persisted?.nodes ?? {}).length).toBe(before + 1);
  });

  it("rejects a blank node input as a friendly error, leaving the graph unchanged", async () => {
    const { repo } = await createPgliteRepository();
    await loadProjectFrom(repo, hasher);

    const result = await addNodeVia(repo, hasher, nodeInput({ title: "   " }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/title/i);

    const persisted = await repo.getGraph("tiny-runner-v1");
    expect(Object.keys(persisted?.nodes ?? {}).length).toBe(TINY_GAME_NODE_COUNT);
  });
});

describe("addEdgeVia", () => {
  it("returns a friendly error for a cycle and leaves the stored graph unchanged", async () => {
    const { repo } = await createPgliteRepository();
    const seed = await loadProjectFrom(repo, hasher);
    const before = await repo.getGraph("tiny-runner-v1");
    const edgeCountBefore = before?.edges.length ?? 0;

    // A self-edge on the subject node is the smallest cycle the DAG guard rejects.
    const result = await addEdgeVia(repo, hasher, {
      type: "derived_from",
      from: seed.subjectDigest,
      to: seed.subjectDigest,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/cycle/i);

    const after = await repo.getGraph("tiny-runner-v1");
    expect(after?.edges.length).toBe(edgeCountBefore);
    expect(Object.keys(after?.nodes ?? {}).length).toBe(TINY_GAME_NODE_COUNT);
  });
});

describe("resetVia", () => {
  it("restores the seed graph after a manual add", async () => {
    const { repo } = await createPgliteRepository();
    await loadProjectFrom(repo, hasher);
    const added = await addNodeVia(repo, hasher, nodeInput({ title: "Will be discarded" }));
    expect(added.ok).toBe(true);
    if (!added.ok) return;
    const addedId = Object.keys(added.seed.graph.nodes).find(
      (id) => added.seed.graph.nodes[id]?.payload.title === "Will be discarded",
    );
    expect(addedId).toBeDefined();

    const reset = await resetVia(repo, hasher);
    expect(Object.keys(reset.graph.nodes).length).toBe(TINY_GAME_NODE_COUNT);
    // The seed root is deterministic: reset must match a fresh tiny-game build's subject.
    expect(reset.subjectDigest).toBe(buildTinyGameGraph(hasher).subjectDigest);
    // The manually-added node is gone.
    if (addedId !== undefined) {
      expect(reset.graph.nodes[addedId]).toBeUndefined();
    }
  });
});

describe("on-disk persistence across instances", () => {
  const dataDir = mkdtempSync(path.join(tmpdir(), "pglite-store-"));

  afterAll(() => {
    rmSync(dataDir, { recursive: true, force: true });
  });

  it("survives closing one PGlite instance and re-opening the same dataDir", async () => {
    // Instance #1: seed + add a node, then CLOSE so the single connection is released.
    const db1 = new PGlite(dataDir);
    await ensureSchema(db1);
    const repo1 = new PostgresEvidenceRepository(db1, new InMemoryBlobStore());
    await loadProjectFrom(repo1, hasher);
    const added = await addNodeVia(
      repo1,
      hasher,
      nodeInput({ title: "Persisted to disk", actorRef: "learner-99" }),
    );
    expect(added.ok).toBe(true);
    await db1.close();

    // Instance #2: a brand-new connection on the SAME dataDir must still see the added node.
    const db2 = new PGlite(dataDir);
    const repo2 = new PostgresEvidenceRepository(db2, new InMemoryBlobStore());
    const graph = await repo2.getGraph("tiny-runner-v1");
    expect(graph).not.toBeNull();
    expect(Object.keys(graph?.nodes ?? {}).length).toBe(TINY_GAME_NODE_COUNT + 1);
    const titles = Object.values(graph?.nodes ?? {}).map((n) => n.payload.title);
    expect(titles).toContain("Persisted to disk");
    await db2.close();
  });
});
