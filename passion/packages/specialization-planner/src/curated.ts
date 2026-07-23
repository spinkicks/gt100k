// `curatedForCell` (A6 grounding) — a thin, pure, deterministic filter over a @gt100k/concierge
// `CuratedLibrary`: the age-eligible, domainPath-compatible resources (ranked reputation-desc, tie
// by id asc, capped) that populate a brief's `BriefContext.resources` so the craft scaffold points
// at real, vetted material. concierge's `pathsCompatible` is not exported, so path compatibility is
// implemented locally over the two-axis `DomainPath` (spec §3.4, plan Task 3).
import { MAX_DOCS } from "@gt100k/concierge";
import type { CuratedLibrary, CuratedResource, AgeTier } from "@gt100k/concierge";
import type { DomainPath } from "@gt100k/two-axis-tagging";

/**
 * Two paths are compatible when they name the same cabin and neither disagrees on the sub-topic
 * (a cabin-level path covers any of its sub-topics, and vice-versa).
 */
function pathsCompatible(a: DomainPath, b: DomainPath): boolean {
  if (a[0] !== b[0]) return false;
  if (a.length === 1 || b.length === 1) return true;
  return a[1] === b[1];
}

/** Deterministic ranking: reputation descending, ties broken by id ascending. */
function byReputationThenId(a: CuratedResource, b: CuratedResource): number {
  if (b.reputation !== a.reputation) return b.reputation - a.reputation;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/**
 * Resolve the vetted curated resources for a (cell × age tier): every age-eligible resource whose
 * `domainPath` is compatible with `domainPath`, ranked (reputation desc, tie by id asc) and capped
 * at `MAX_DOCS`. Returns `[]` when nothing in the library covers the cell.
 */
export function curatedForCell(
  library: CuratedLibrary,
  domainPath: DomainPath,
  ageTier: AgeTier,
): readonly CuratedResource[] {
  return library
    .filter((r) => r.ageTiers.includes(ageTier) && pathsCompatible(domainPath, r.domainPath))
    .slice()
    .sort(byReputationThenId)
    .slice(0, MAX_DOCS);
}
