import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertHumanAuthority,
  graphMerkleRoot,
} from "../../../packages/evidence-graph/src/index.js";
import { NodeCryptoHasher } from "../../evidence-hash-node/src/index.js";
import { DeterministicStubVerifier } from "../../evidence-verifier-stub/src/index.js";
import { InMemoryBlobStore, PostgresEvidenceRepository, ensureSchema } from "./index.js";
import { seedTinyGame } from "./seed.js";

/** Default on-disk pglite store, anchored to this package (NOT cwd). Overridable via env. */
const DEFAULT_DATA_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..", ".pglite-data");

async function main(): Promise<void> {
  const dataDir = process.env.PGLITE_DATA_DIR ?? DEFAULT_DATA_DIR;
  const hasher = new NodeCryptoHasher();
  const verifier = new DeterministicStubVerifier();

  // PERSISTENT pglite: a dataDir path makes the store survive across runs (in-memory otherwise).
  const { PGlite } = await import("@electric-sql/pglite");
  const db = new PGlite(dataDir);
  await ensureSchema(db);

  const repo = new PostgresEvidenceRepository(db, new InMemoryBlobStore());
  const { projectId, root } = await seedTinyGame(repo, hasher);

  const graph = await repo.getGraph(projectId);
  if (graph === null) {
    throw new Error("SEED_FAILED: graph not persisted");
  }
  const projects = await repo.listProjects();
  const authority = assertHumanAuthority(graph);
  const verification = await verifier.verify(graph, hasher);
  const reloadedRoot = graphMerkleRoot(graph, hasher);

  console.log(`Data dir: ${dataDir}`);
  console.log(
    `Project: ${projectId} (${projects.length} project${projects.length === 1 ? "" : "s"} total)`,
  );
  console.log(`Graph: ${Object.keys(graph.nodes).length} nodes, ${graph.edges.length} edges`);
  console.log(`Graph root: ${reloadedRoot}`);
  console.log(`Human authority: ${authority.ok ? "PASS" : `FAIL:${authority.reasons.join(",")}`}`);
  console.log(
    `Verification: ${verification.ok ? "PASS" : `FAIL:${verification.reasons.join(",")}`}`,
  );

  if (reloadedRoot !== root) {
    throw new Error(`ROOT_MISMATCH:${root}!=${reloadedRoot}`);
  }
  if (!authority.ok || !verification.ok || projects.length !== 1) {
    process.exitCode = 1;
  }

  await db.close();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
