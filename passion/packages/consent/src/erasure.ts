// Taking a child back out.
//
// The roadmap calls right-to-erasure on append-only child data "a hard pre-live gate", and it is
// two different problems wearing one name. This file solves one of them and is explicit that it
// does not touch the other.
//
// THE SOLVED HALF. A `StudentProfile` is a JSON file per child. Its interaction log is append-only
// as a discipline, not as a cryptographic commitment: nothing outside it references those records,
// no id is derived from their content, and deleting the file leaves nothing dangling. So erasure
// here is deletion, and it can be complete.
//
// THE UNSOLVED HALF. The EvidenceGraph is content-addressed: a node's id IS the hash of its
// content, and edges reference those ids. Deleting a node breaks every edge that points at it, and
// the ids themselves leak the shape of what was deleted. That is E1's D2, it is named unsolved in
// the hardening docs, and it is not this package's to fix. What this package can do is refuse to
// pretend otherwise: `ErasureResult.unerased` names every store that held data and could not
// forget it, so a guardian is told the truth rather than shown a green tick.
//
// Which is why the ingest path built alongside this deliberately does not feed the graph. A child's
// discovery record is erasable in principle, because a profile is a single file, but nothing calls
// this: `profile-store-fs` does not implement `ErasableStore` and the only implementations are the
// doubles in this package's own test. Their project evidence cannot be erased even in principle,
// and between them that is why the gate is still shut.

/** Somewhere a child's data might live. */
export interface ErasableStore {
  /** A name a guardian could be shown. */
  readonly name: string;
  /** Remove everything for this child. Resolves false when the store cannot forget. */
  erase(kidId: string): Promise<boolean>;
}

export interface ErasureResult {
  readonly kidId: string;
  readonly erased: readonly string[];
  /** Stores that could not forget, named so nobody has to guess what survived. */
  readonly unerased: readonly string[];
  /** True only when every store reported success. */
  readonly complete: boolean;
}

/**
 * Ask every store to forget a child, and report honestly on the ones that could not.
 *
 * Never throws and never stops early. A store that fails must not prevent the others from
 * succeeding: partial erasure is strictly better than none, and the alternative is one broken
 * adapter keeping a child's data everywhere.
 */
export async function eraseEverywhere(
  stores: readonly ErasableStore[],
  kidId: string,
): Promise<ErasureResult> {
  const erased: string[] = [];
  const unerased: string[] = [];

  for (const store of stores) {
    let ok = false;
    try {
      ok = await store.erase(kidId);
    } catch {
      ok = false;
    }
    (ok ? erased : unerased).push(store.name);
  }

  return { kidId, erased, unerased, complete: unerased.length === 0 };
}
