// The `ProfileStore` port + an in-memory adapter. The orchestrator itself is pure/sync; this port
// exists only for persistence / roster loading (the fs adapter and the browser's in-memory use).
// Callers must never be able to mutate stored state — the memory adapter deep-clones in AND out.
import type { StudentProfile } from "./model.js";

export interface ProfileStore {
  load(kidId: string): Promise<StudentProfile | null>;
  save(profile: StudentProfile): Promise<void>;
  list(): Promise<readonly string[]>; // kidIds
}

/**
 * Map-backed `ProfileStore`. Every profile is `structuredClone`d on save and again on load, so the
 * stored value shares no references with the caller's object in either direction — mutating what you
 * hand to `save` or what you get back from `load` can never corrupt the store's copy.
 */
export function createMemoryProfileStore(seed: readonly StudentProfile[] = []): ProfileStore {
  const byKid = new Map<string, StudentProfile>();
  for (const profile of seed) byKid.set(profile.kidId, structuredClone(profile));

  return {
    async load(kidId: string): Promise<StudentProfile | null> {
      const stored = byKid.get(kidId);
      return stored === undefined ? null : structuredClone(stored);
    },
    async save(profile: StudentProfile): Promise<void> {
      byKid.set(profile.kidId, structuredClone(profile));
    },
    async list(): Promise<readonly string[]> {
      return [...byKid.keys()];
    },
  };
}
