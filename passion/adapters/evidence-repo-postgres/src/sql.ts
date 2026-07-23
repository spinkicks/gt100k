/**
 * Driver-agnostic SQL seam. Both `@electric-sql/pglite`'s `PGlite` (`db.query(text, params)`
 * → `{ rows }`) and node-postgres `pg.Pool` (`pool.query(text, values)` → `{ rows }`) satisfy
 * this shape, so the same repository runs against embedded pglite (tests/demo) and real
 * Postgres (prod) with no code change.
 */
export interface SqlClient {
  // biome-ignore lint/suspicious/noExplicitAny: driver-agnostic row shape — pglite and node-postgres both return `{ rows: any[] }`; narrowing here breaks structural compatibility with both.
  query(text: string, params?: unknown[]): Promise<{ rows: any[] }>;
}

/**
 * Idempotent schema DDL. Safe to run on every startup — every statement is `IF NOT EXISTS`,
 * so it converges an empty database to the target schema and is a no-op thereafter.
 */
export async function ensureSchema(sql: SqlClient): Promise<void> {
  await sql.query(`
    CREATE TABLE IF NOT EXISTS projects (
      id text PRIMARY KEY,
      name text NOT NULL,
      student_id text NOT NULL,
      status text NOT NULL DEFAULT 'active',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  await sql.query(`
    CREATE TABLE IF NOT EXISTS nodes (
      project_id text NOT NULL,
      id text NOT NULL,
      type text NOT NULL,
      ts text NOT NULL,
      node jsonb NOT NULL,
      blob_ref text,
      PRIMARY KEY (project_id, id)
    )
  `);

  await sql.query(`
    CREATE TABLE IF NOT EXISTS edges (
      project_id text NOT NULL,
      type text NOT NULL,
      from_id text NOT NULL,
      to_id text NOT NULL,
      label text
    )
  `);

  await sql.query("CREATE INDEX IF NOT EXISTS nodes_project_id_idx ON nodes (project_id)");
  await sql.query("CREATE INDEX IF NOT EXISTS edges_project_id_idx ON edges (project_id)");
}
