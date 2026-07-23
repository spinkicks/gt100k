// @gt100k/profile-store-fs — a `ProfileStore` backed by one JSON file per kid (`${kidId}.json`).
// A local-dev / demo convenience only (NOT the production store; real persistence/consent/erasure is G3).
// Filesystem only — no network. `StudentProfile` is JSON-safe (plain arrays/records + `store.byId`),
// so a save→load round-trips deep-equal.
import { mkdir, readFile, writeFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import type { ProfileStore, StudentProfile } from "@gt100k/student-profile";

/** JSON-file-per-kid `ProfileStore` rooted at `dir` (created lazily on first save). */
export function createFsProfileStore(dir: string): ProfileStore {
  const fileFor = (kidId: string): string => join(dir, `${kidId}.json`);

  return {
    async load(kidId: string): Promise<StudentProfile | null> {
      try {
        const raw = await readFile(fileFor(kidId), "utf8");
        return JSON.parse(raw) as StudentProfile;
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
        throw err;
      }
    },
    async save(profile: StudentProfile): Promise<void> {
      await mkdir(dir, { recursive: true });
      await writeFile(fileFor(profile.kidId), JSON.stringify(profile), "utf8");
    },
    async list(): Promise<readonly string[]> {
      try {
        const names = await readdir(dir);
        return names.filter((n) => n.endsWith(".json")).map((n) => n.slice(0, -".json".length));
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
        throw err;
      }
    },
  };
}
