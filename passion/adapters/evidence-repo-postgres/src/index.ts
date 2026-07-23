import type {
  EvidenceEdge,
  EvidenceGraph,
  EvidenceNode,
} from "../../../packages/evidence-graph/src/model.js";
import type { EvidenceRepository } from "../../../packages/evidence-graph/src/ports.js";
import { type BlobStore, InMemoryBlobStore } from "./blob-store.js";
import { assertNoObviousPii } from "./pii.js";
import type { Project } from "./project.js";
import { type SqlClient, ensureSchema } from "./sql.js";

export type { BlobStore } from "./blob-store.js";
export { InMemoryBlobStore } from "./blob-store.js";
export type { Project } from "./project.js";
export { type SqlClient, ensureSchema } from "./sql.js";
export { assertNoObviousPii } from "./pii.js";

/** jsonb columns come back parsed as objects on pglite/pg; tolerate a string just in case. */
function parseNode(value: unknown): EvidenceNode {
  return (typeof value === "string" ? JSON.parse(value) : value) as EvidenceNode;
}

/**
 * `EvidenceRepository` backed by any `SqlClient` (embedded pglite in tests/demo, node-postgres
 * `pg.Pool` in prod) plus a `BlobStore` for artifact bytes. One graph per project: `saveGraph`
 * replaces the whole graph atomically, and `deleteGraph` is the v1 delete-the-project erasure
 * story covering rows and blobs.
 */
export class PostgresEvidenceRepository implements EvidenceRepository {
  constructor(
    private readonly sql: SqlClient,
    private readonly blobStore: BlobStore,
  ) {}

  async saveGraph(projectId: string, graph: EvidenceGraph): Promise<void> {
    assertNoObviousPii(graph);

    await this.sql.query("BEGIN");
    try {
      await this.sql.query("DELETE FROM edges WHERE project_id = $1", [projectId]);
      await this.sql.query("DELETE FROM nodes WHERE project_id = $1", [projectId]);

      for (const [id, node] of Object.entries(graph.nodes)) {
        // Whole node → jsonb so it round-trips byte-identically (the content hash must survive);
        // type + ts are denormalized for ordering/queries. blob_ref is forward-compat (unused).
        await this.sql.query(
          `INSERT INTO nodes (project_id, id, type, ts, node, blob_ref)
           VALUES ($1, $2, $3, $4, $5::jsonb, NULL)`,
          [projectId, id, node.type, node.timestamp, JSON.stringify(node)],
        );
      }

      for (const edge of graph.edges) {
        await this.sql.query(
          `INSERT INTO edges (project_id, type, from_id, to_id, label)
           VALUES ($1, $2, $3, $4, $5)`,
          [projectId, edge.type, edge.from, edge.to, edge.label ?? null],
        );
      }

      await this.sql.query("COMMIT");
    } catch (error) {
      await this.sql.query("ROLLBACK");
      throw error;
    }
  }

  async getGraph(projectId: string): Promise<EvidenceGraph | null> {
    const nodeResult = await this.sql.query(
      "SELECT id, node FROM nodes WHERE project_id = $1 ORDER BY ts, id",
      [projectId],
    );
    if (nodeResult.rows.length === 0) {
      return null;
    }

    const nodes: Record<string, EvidenceNode> = {};
    for (const row of nodeResult.rows) {
      nodes[row.id as string] = parseNode(row.node);
    }

    const edgeResult = await this.sql.query(
      "SELECT type, from_id, to_id, label FROM edges WHERE project_id = $1 ORDER BY from_id, to_id, type",
      [projectId],
    );
    const edges: EvidenceEdge[] = edgeResult.rows.map((row) => {
      const edge: EvidenceEdge = {
        type: row.type,
        from: row.from_id,
        to: row.to_id,
      };
      if (row.label !== null && row.label !== undefined) {
        edge.label = row.label;
      }
      return edge;
    });

    return { nodes, edges };
  }

  /** Erasure: drop edges, nodes, the project row, AND every blob under the project. */
  async deleteGraph(projectId: string): Promise<void> {
    await this.sql.query("DELETE FROM edges WHERE project_id = $1", [projectId]);
    await this.sql.query("DELETE FROM nodes WHERE project_id = $1", [projectId]);
    await this.sql.query("DELETE FROM projects WHERE id = $1", [projectId]);
    await this.blobStore.deleteByProject(projectId);
  }

  /** Adapter-specific (NOT on the port): UPSERT a project row, bumping updated_at. */
  async saveProject(project: Project): Promise<void> {
    await this.sql.query(
      `INSERT INTO projects (id, name, student_id, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE
         SET name = EXCLUDED.name,
             student_id = EXCLUDED.student_id,
             status = EXCLUDED.status,
             updated_at = EXCLUDED.updated_at`,
      [
        project.id,
        project.name,
        project.studentId,
        project.status,
        project.createdAt,
        project.updatedAt,
      ],
    );
  }

  async getProject(id: string): Promise<Project | null> {
    const result = await this.sql.query(
      "SELECT id, name, student_id, status, created_at, updated_at FROM projects WHERE id = $1",
      [id],
    );
    const row = result.rows[0];
    return row === undefined ? null : rowToProject(row as ProjectRow);
  }

  async listProjects(): Promise<Project[]> {
    const result = await this.sql.query(
      "SELECT id, name, student_id, status, created_at, updated_at FROM projects ORDER BY id",
    );
    return result.rows.map((row) => rowToProject(row as ProjectRow));
  }
}

/** Raw shape of a `projects` row (timestamptz decodes as Date on pglite/pg). */
interface ProjectRow {
  id: string;
  name: string;
  student_id: string;
  status: string;
  created_at: unknown;
  updated_at: unknown;
}

function rowToProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    studentId: row.student_id,
    status: row.status,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

/** timestamptz round-trips as a Date on pglite/pg; normalize to an ISO string. */
function toIso(value: unknown): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

/** Convenience for tests/demo: an embedded pglite-backed repo with the schema applied. */
export async function createPgliteRepository(): Promise<{
  repo: PostgresEvidenceRepository;
  sql: SqlClient;
  blobStore: BlobStore;
}> {
  const { PGlite } = await import("@electric-sql/pglite");
  const db = new PGlite();
  await ensureSchema(db);
  const blobStore = new InMemoryBlobStore();
  const repo = new PostgresEvidenceRepository(db, blobStore);
  return { repo, sql: db, blobStore };
}
