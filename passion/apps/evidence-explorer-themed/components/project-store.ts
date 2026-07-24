import path from "node:path";
/**
 * Persistent project store (P3b) — the **source of truth** for the Observatory's evidence graph.
 *
 * The graph lives in an on-disk pglite database (a WASM Postgres) so the seeded `tiny-runner-v1`
 * project AND every manual add survive a page refresh and a dev-server restart. On load the store
 * reads the project (seeding it if absent); add-node / add-edge / reset mutate the store and persist.
 *
 * SERVER-ONLY. This module reaches `node:crypto` (via {@link NodeCryptoHasher}) and `@electric-sql/
 * pglite`, so it MUST only be imported from a Server Component, a `"use server"` action, or a test —
 * never from a `"use client"` module.
 *
 * pglite is a SINGLE-CONNECTION database: the same `dataDir` must not be opened twice concurrently.
 * We therefore hold ONE `PGlite` instance per process behind a cached init promise stashed on
 * `globalThis` (so Next's dev HMR, which re-evaluates modules, still reuses the one connection).
 *
 * The read-modify-write core is factored into repo-taking functions ({@link loadProjectFrom},
 * {@link addNodeVia}, {@link addEdgeVia}, {@link resetVia}) so tests can drive them against an
 * ephemeral in-memory repo; the exported wrappers just bind them to the on-disk singleton.
 */
import { PGlite } from "@electric-sql/pglite";
import type { EvidenceGraph } from "@gt100k/evidence-graph";
import { NodeCryptoHasher } from "@gt100k/evidence-hash-node";
import {
  InMemoryBlobStore,
  PostgresEvidenceRepository,
  ensureSchema,
} from "@gt100k/evidence-repo-postgres";
import { buildTinyGameGraph } from "@gt100k/evidence-tiny-game";
import {
  type AddEdgeInput,
  type AddNodeInput,
  type Hasher,
  applyAddEdge,
  applyAddNode,
  rebuildBundle,
  tamperSubject,
} from "./manual-add.js";
import type { SyntheticSeed, SyntheticVerification } from "./synthetic-view.js";

/** The project this build attests to. Content ids (incl. the subject) are derived from the seed. */
const PROJECT_REF = "tiny-runner-v1";

/**
 * Fixed project-row timestamps so re-seeding is byte-stable (mirrors the adapter's own seed): the
 * `projects` upsert writes these exact values on insert AND conflict, so `updated_at` never drifts.
 */
const SEED_TIMESTAMP = "2026-05-12T00:00:00.000Z";

/** The minimal repository surface the store's core needs (structural — no adapter deep import). */
interface GraphRepo {
  getGraph(projectId: string): Promise<EvidenceGraph | null>;
  saveGraph(projectId: string, graph: EvidenceGraph): Promise<void>;
  saveProject(project: {
    id: string;
    name: string;
    studentId: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  }): Promise<void>;
}

/** What a mutation returns: the fresh, serializable seed bundle, else a friendly error string. */
export type StoreResult =
  | { readonly ok: true; readonly seed: SyntheticSeed }
  | { readonly ok: false; readonly error: string };

/** Map a thrown domain error to a calm, non-accusatory sentence for the panel. */
export function friendlyError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  if (message.startsWith("INVALID_NODE_INPUT")) {
    return "Enter a title and an actor reference before adding a node.";
  }
  if (message.startsWith("CYCLE")) {
    return "That edge would create a cycle — evidence flows one way, from sources to outcomes.";
  }
  if (message.startsWith("DANGLING_REF")) {
    return "That edge points to a node that isn't in the graph yet.";
  }
  return "That add could not be applied.";
}

/** The stable subject digest (released-artifact node id) — deterministic from the tiny-game seed. */
function subjectDigestOf(hasher: Hasher): string {
  return buildTinyGameGraph(hasher).subjectDigest;
}

/**
 * Idempotently seed the deterministic tiny-runner-v1 journey into a repository (replace-in-place):
 * `saveGraph` swaps the whole graph and `saveProject` UPSERTs the row, so running it twice converges
 * to the same graph + Merkle root. Returns the seeded graph for immediate use.
 */
async function seedProject(repo: GraphRepo, hasher: Hasher): Promise<EvidenceGraph> {
  const bundle = buildTinyGameGraph(hasher);
  await repo.saveProject({
    id: bundle.projectId,
    name: bundle.projectName,
    studentId: bundle.studentId,
    status: "active",
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  });
  await repo.saveGraph(bundle.projectId, bundle.graph);
  return bundle.graph;
}

/**
 * Re-derive the full serializable seed for a working graph: the `ExplorerView` + both the honest and
 * the (deterministically) tampered `VerificationView`, so the Verify/Tamper demo keeps working after
 * manual adds. The tamper targets the released-artifact byte-body — never a person.
 */
async function deriveSeed(
  graph: EvidenceGraph,
  subjectDigest: string,
  hasher: Hasher,
): Promise<SyntheticSeed> {
  const honest = await rebuildBundle(graph, PROJECT_REF, subjectDigest, hasher);
  const tampered = await rebuildBundle(
    tamperSubject(graph, subjectDigest),
    PROJECT_REF,
    subjectDigest,
    hasher,
  );
  const verification: SyntheticVerification = {
    verified: honest.verification,
    tampered: tampered.verification,
    tamperNodeId: subjectDigest,
  };
  return {
    graph: honest.graph,
    view: honest.view,
    verification,
    projectRef: PROJECT_REF,
    subjectDigest,
  };
}

/** Read current graph from the repo, seeding it first if the project is absent. */
async function readOrSeed(repo: GraphRepo, hasher: Hasher): Promise<EvidenceGraph> {
  const existing = await repo.getGraph(PROJECT_REF);
  return existing ?? (await seedProject(repo, hasher));
}

// ── Repo-taking core (unit-testable against an ephemeral repo) ─────────────────────────────────

/** Ensure the project exists, then return its rebuilt seed bundle. */
export async function loadProjectFrom(repo: GraphRepo, hasher: Hasher): Promise<SyntheticSeed> {
  const graph = await readOrSeed(repo, hasher);
  return deriveSeed(graph, subjectDigestOf(hasher), hasher);
}

/** Append a manual node to the stored graph, persist, and return the rebuilt seed (or an error). */
export async function addNodeVia(
  repo: GraphRepo,
  hasher: Hasher,
  input: AddNodeInput,
): Promise<StoreResult> {
  try {
    const current = await readOrSeed(repo, hasher);
    const { graph } = applyAddNode(current, input, hasher);
    await repo.saveGraph(PROJECT_REF, graph);
    return { ok: true, seed: await deriveSeed(graph, subjectDigestOf(hasher), hasher) };
  } catch (err) {
    return { ok: false, error: friendlyError(err) };
  }
}

/** Append a manual edge to the stored graph, persist, and return the rebuilt seed (or an error). */
export async function addEdgeVia(
  repo: GraphRepo,
  hasher: Hasher,
  input: AddEdgeInput,
): Promise<StoreResult> {
  try {
    const current = await readOrSeed(repo, hasher);
    const { graph } = applyAddEdge(current, input);
    await repo.saveGraph(PROJECT_REF, graph);
    return { ok: true, seed: await deriveSeed(graph, subjectDigestOf(hasher), hasher) };
  } catch (err) {
    return { ok: false, error: friendlyError(err) };
  }
}

/** Re-seed the project (idempotent replace) and return the fresh seed bundle. */
export async function resetVia(repo: GraphRepo, hasher: Hasher): Promise<SyntheticSeed> {
  const graph = await seedProject(repo, hasher);
  return deriveSeed(graph, subjectDigestOf(hasher), hasher);
}

// ── On-disk singleton (one PGlite connection per process) ──────────────────────────────────────

interface StoreSingleton {
  readonly repo: PostgresEvidenceRepository;
  readonly hasher: NodeCryptoHasher;
}

/**
 * Resolve the on-disk pglite directory. `PGLITE_DATA_DIR` wins (the DoD runtime proof points it at a
 * fresh temp dir); otherwise default to `<app>/.pglite-data`. We anchor on `process.cwd()` — which is
 * the app dir when `next` runs — rather than `import.meta.url`, because webpack rewrites the module
 * URL into `.next/` at build time, so it is not a stable anchor for the app root.
 */
function resolveDataDir(): string {
  const fromEnv = process.env.PGLITE_DATA_DIR;
  if (fromEnv !== undefined && fromEnv.trim() !== "") {
    return fromEnv;
  }
  return path.join(process.cwd(), ".pglite-data");
}

/** The process-global slot that guarantees exactly one PGlite connection across HMR re-evaluations. */
const globalStore = globalThis as typeof globalThis & {
  __evidenceStorePromise?: Promise<StoreSingleton>;
};

/** Lazily create (once) the on-disk pglite repo + hasher, applying the schema on first init. */
function getStore(): Promise<StoreSingleton> {
  if (globalStore.__evidenceStorePromise === undefined) {
    globalStore.__evidenceStorePromise = (async () => {
      const db = new PGlite(resolveDataDir());
      await ensureSchema(db);
      const repo = new PostgresEvidenceRepository(db, new InMemoryBlobStore());
      return { repo, hasher: new NodeCryptoHasher() };
    })();
  }
  return globalStore.__evidenceStorePromise;
}

// ── Public API (bound to the on-disk singleton) ───────────────────────────────────────────────

/** Load the persisted project, auto-seeding tiny-runner-v1 on first ever run. */
export async function loadProject(): Promise<SyntheticSeed> {
  const { repo, hasher } = await getStore();
  return loadProjectFrom(repo, hasher);
}

/** Persist a manual node add to the store. */
export async function addNodeToStore(input: AddNodeInput): Promise<StoreResult> {
  const { repo, hasher } = await getStore();
  return addNodeVia(repo, hasher, input);
}

/** Persist a manual edge add to the store. */
export async function addEdgeToStore(input: AddEdgeInput): Promise<StoreResult> {
  const { repo, hasher } = await getStore();
  return addEdgeVia(repo, hasher, input);
}

/** Reset the persisted project back to the seed graph. */
export async function resetProject(): Promise<SyntheticSeed> {
  const { repo, hasher } = await getStore();
  return resetVia(repo, hasher);
}
