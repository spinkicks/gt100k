/**
 * Blob storage seam. Keys are `${projectId}/${digest}`. The in-memory implementation is the
 * default for this phase; an `S3BlobStore` implementing this same port slots in at deploy time
 * (deploy-only — no AWS SDK dependency is pulled into the domain/adapter build here).
 *
 * `deleteByProject` is the reason this seam exists now: `deleteGraph` erasure must be
 * complete-by-construction across rows AND blobs once real artifact uploads land in a later
 * phase. No blob *offloading* happens this phase — node payloads are small JSON kept in the
 * `nodes.node` jsonb column.
 */
export interface BlobStore {
  put(key: string, bytes: Uint8Array): Promise<void>;
  get(key: string): Promise<Uint8Array | null>;
  deleteByProject(projectId: string): Promise<void>;
}

/** Map-backed BlobStore keyed by `${projectId}/${digest}`. */
export class InMemoryBlobStore implements BlobStore {
  private readonly blobs = new Map<string, Uint8Array>();

  async put(key: string, bytes: Uint8Array): Promise<void> {
    this.blobs.set(key, bytes.slice());
  }

  async get(key: string): Promise<Uint8Array | null> {
    const bytes = this.blobs.get(key);
    return bytes === undefined ? null : bytes.slice();
  }

  async deleteByProject(projectId: string): Promise<void> {
    const prefix = `${projectId}/`;
    for (const key of this.blobs.keys()) {
      if (key.startsWith(prefix)) {
        this.blobs.delete(key);
      }
    }
  }
}
