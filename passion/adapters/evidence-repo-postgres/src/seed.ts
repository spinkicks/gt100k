import { buildTinyGameGraph } from "@gt100k/evidence-tiny-game";
import { graphMerkleRoot } from "../../../packages/evidence-graph/src/merkle.js";
import type { Hasher } from "../../../packages/evidence-graph/src/ports.js";
import type { PostgresEvidenceRepository } from "./index.js";

/**
 * Fixed project-row timestamps so re-seeding is byte-stable: the `projects` upsert writes these
 * exact values on both insert and conflict, so `updated_at` never drifts across runs. The graph's
 * Merkle root is over node content only and is independent of these anyway.
 */
const SEED_TIMESTAMP = "2026-05-12T00:00:00.000Z";

/**
 * Idempotently seed the deterministic tiny-code-game journey into a repository. Running it twice
 * yields the same graph (`saveGraph` replaces the whole graph) and the same `graphMerkleRoot`, and
 * `listProjects()` shows exactly one `tiny-runner-v1` (`saveProject` is an UPSERT).
 */
export async function seedTinyGame(
  repo: PostgresEvidenceRepository,
  hasher: Hasher,
): Promise<{ projectId: string; root: string }> {
  const { graph, projectId, projectName, studentId } = buildTinyGameGraph(hasher);

  await repo.saveProject({
    id: projectId,
    name: projectName,
    studentId,
    status: "active",
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  });
  await repo.saveGraph(projectId, graph);

  return { projectId, root: graphMerkleRoot(graph, hasher) };
}
