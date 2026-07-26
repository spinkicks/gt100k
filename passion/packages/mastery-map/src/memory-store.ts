/**
 * An in-memory `MapStore`. Slice 1 ships no real persistence, so this exists for tests and for the
 * console's default render, and it is the reference implementation of the two behaviours in spec §4
 * that a real adapter will have to reproduce.
 *
 * Keyed by `MasteryMap.id` and not by `domainPath`, because the id is the stable identity and the
 * taxonomy is expected to move: a domain being re-keyed is an edit to a field on an existing map,
 * not the birth of a rival. Resolution by path is therefore a lookup ACROSS the stored maps, which
 * is what `get` does below.
 */
import type { DomainPath } from "@gt100k/two-axis-tagging";

import { canPublish } from "./edit.js";
import type { MasteryMap } from "./model.js";
import type { MapStore } from "./ports.js";
import { samePath, servesPath } from "./resolve.js";

/** Stable token at the head of the thrown message, so a caller keys on this and not on prose. */
export const MAP_VERSION_CONFLICT = "VERSION_CONFLICT";

/**
 * Map-backed `MapStore`. Every map is `structuredClone`d on the way in and again on the way out, so
 * the stored value shares no references with the caller in either direction: mutating what you hand
 * to `put`, or what you get back from `get`, can never reach the store's copy.
 */
export function createMemoryMapStore(
  seed: readonly MasteryMap[] = [],
  /** Optional, and used only to judge freshness in `get`. The engine reads no clock of its own, so
      with none supplied this store checks a map's errors and says nothing about its age, exactly
      as warning rule 5 does not fire without one. */
  now?: string,
): MapStore {
  const byId = new Map<string, MasteryMap>();
  for (const map of seed) byId.set(map.id, structuredClone(map));

  /**
   * Most specific first, then the cabin above it, through the one predicate that owns that rule
   * (`servesPath`). A cabin query never resolves DOWN to a sub-topic map: the fallback only ever
   * widens. Whichever one wins is returned WHOLE, because a merged DAG is one nobody authored and
   * nobody validated.
   *
   * Later writes win where two maps claim one path, which is a conflict for a real adapter to make
   * impossible rather than something to resolve by blending them here.
   */
  const resolve = (domainPath: DomainPath): MasteryMap | undefined => {
    let exact: MasteryMap | undefined;
    let wider: MasteryMap | undefined;
    for (const map of byId.values()) {
      if (samePath(map.domainPath, domainPath)) exact = map;
      else if (servesPath(map.domainPath, domainPath)) wider = map;
    }
    return exact ?? wider;
  };

  return {
    async get(domainPath: DomainPath): Promise<MasteryMap | null> {
      const resolved = resolve(domainPath);
      if (resolved === undefined) return null;
      // Spec §8: a map with a problem on it never reaches whatever a plan would consume. Note that
      // this refuses rather than widening to the cabin map: the fallback above is for a map that
      // is ABSENT, and swapping in a different domain's map because this one has an error would be
      // a substitution the caller has no way of noticing.
      return canPublish(resolved, now).ok ? structuredClone(resolved) : null;
    },

    async getForReview(domainPath: DomainPath): Promise<MasteryMap | null> {
      // No filter. The review screen is where a broken map gets fixed, so it has to be able to see
      // one. Everything reachable from here is domain knowledge, and no child is downstream of it.
      const resolved = resolve(domainPath);
      return resolved === undefined ? null : structuredClone(resolved);
    },

    async put(map: MasteryMap): Promise<void> {
      const stored = byId.get(map.id);
      const expected = stored === undefined ? 1 : stored.version + 1;
      if (map.version !== expected) {
        throw new Error(
          [
            `${MAP_VERSION_CONFLICT}: map "${map.id}" is at version ${stored?.version ?? "none"},`,
            `so the next write must be version ${expected}, not ${map.version}.`,
            "Re-read and re-apply; the stored map has not been changed.",
          ].join(" "),
        );
      }
      byId.set(map.id, structuredClone(map));
    },

    async listDrafts(): Promise<readonly MasteryMap[]> {
      return [...byId.values()].filter((m) => m.status === "draft").map((m) => structuredClone(m));
    },
  };
}
