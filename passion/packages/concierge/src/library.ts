// The curated library (A6) — curated-FIRST resolution (spec §3.2 stage 3, [D3]).
// A `CuratedResource` is tagged by (domain × mode) so it can seed discovery; the library
// answers a request from curated material *before* any open-web retrieval, and it is the
// compounding lever that shrinks live retrieval over time (promotion lands in Task 6).
//
// Request → tag inference is unspecified by the spec; we take the simplest correct route:
// keyword/slug match of the message against the two-axis taxonomy (cabins + seed subtopics).
// Coverage = an age-eligible resource whose domainPath is compatible with an inferred path.
// (Mode inference from free text is unreliable, so affordedModes are carried for downstream
// discovery seeding but are NOT part of the coverage predicate — see .loop/decisions.md.)
import {
  CABINS,
  SEED_SUBTOPICS,
  serializePath,
  slugify,
  type CabinId,
  type DomainPath,
} from "@gt100k/two-axis-tagging";
import { MAX_DOCS, type AgeTier, type ConciergeRequest, type CuratedResource } from "./model.js";

/** An immutable curated library value. */
export type CuratedLibrary = readonly CuratedResource[];

// Build a lookup of every taxonomy slug (cabin ids + seed subtopics) → the DomainPath it names.
// Subtopics win over cabins when both could match a token (finer is more actionable).
const SLUG_TO_PATHS: ReadonlyMap<string, readonly DomainPath[]> = (() => {
  const m = new Map<string, DomainPath[]>();
  const add = (slug: string, path: DomainPath): void => {
    const list = m.get(slug) ?? [];
    list.push(path);
    m.set(slug, list);
  };
  for (const cabin of CABINS) {
    add(cabin, [cabin] as const);
    for (const sub of SEED_SUBTOPICS[cabin]) add(sub, [cabin, sub] as const);
  }
  return m;
})();

/**
 * Infer the candidate domain paths a free-text message points at, by matching its slugged
 * tokens against the taxonomy. Deterministic; returns paths in first-seen token order,
 * de-duplicated by their serialized form.
 */
export function inferDomainPaths(message: string): readonly DomainPath[] {
  const seen = new Set<string>();
  const out: DomainPath[] = [];
  for (const token of slugify(message).split("-")) {
    if (token.length === 0) continue;
    const paths = SLUG_TO_PATHS.get(token);
    if (!paths) continue;
    for (const p of paths) {
      const key = serializePath(p);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(p);
    }
  }
  return out;
}

// Two paths are compatible when they name the same cabin and neither disagrees on the subtopic
// (a cabin-level path covers any of its subtopics, and vice-versa).
function pathsCompatible(a: DomainPath, b: DomainPath): boolean {
  const [ca] = a;
  const [cb] = b;
  if ((ca as CabinId) !== (cb as CabinId)) return false;
  if (a.length === 1 || b.length === 1) return true;
  return a[1] === b[1];
}

function matchesRequest(resource: CuratedResource, request: ConciergeRequest): boolean {
  if (!resource.ageTiers.includes(request.ageTier)) return false;
  // The child's open project counts as a named domain. Without it, the questions a child actually
  // asks while making something -- "how do I make it bounce?" -- name no domain, match nothing and
  // get refused, even though the caller knows exactly what they are working on. Additive, never
  // restrictive: a message that names its own domain still matches on that.
  const inferred = [...inferDomainPaths(request.message)];
  if (request.workingOn !== undefined) inferred.push(request.workingOn);
  return inferred.some((p) => pathsCompatible(p, resource.domainPath));
}

// Deterministic ranking: reputation descending, ties broken by id ascending.
function byReputationThenId(a: CuratedResource, b: CuratedResource): number {
  if (b.reputation !== a.reputation) return b.reputation - a.reputation;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/**
 * Resolve a request against the curated library: every age-eligible resource whose domainPath
 * is compatible with the message's inferred paths, ranked (reputation desc, tie by id asc) and
 * capped at MAX_DOCS. Returns `[]` when nothing covers the need.
 */
export function resolve(
  lib: CuratedLibrary,
  request: ConciergeRequest,
): readonly CuratedResource[] {
  return lib
    .filter((r) => matchesRequest(r, request))
    .slice()
    .sort(byReputationThenId)
    .slice(0, MAX_DOCS);
}

/**
 * Every age-eligible resource for a cell, ranked, without going through a message.
 *
 * `resolve` exists for the concierge, where a child has typed something and the path has to be
 * inferred from it. A surface that already knows where the child is standing should not have to
 * write a sentence for the inferrer to take apart again: a shelf in the maths cabin knows it is the
 * maths cabin, and round-tripping that through prose could only lose it.
 *
 * `ageTiers` is a set rather than one tier because a surface serves a band and not a birthday, and
 * the PRD is explicit that age is not a gate. A resource is eligible if it suits any tier in the
 * band. Ordering is `resolve`'s, so the same cell ranks the same way whichever door it is asked
 * through.
 */
export function curatedForCell(
  lib: CuratedLibrary,
  domainPath: DomainPath,
  ageTiers: readonly AgeTier[],
  limit = MAX_DOCS,
): readonly CuratedResource[] {
  return lib
    .filter(
      (r) =>
        r.ageTiers.some((t) => ageTiers.includes(t)) && pathsCompatible(domainPath, r.domainPath),
    )
    .slice()
    .sort(byReputationThenId)
    .slice(0, limit);
}

/**
 * How many tiles a resource stocks, ascending — the shelf's first sort key.
 *
 * REPUTATION RANKS TRUST, NOT RELEVANCE, and on a tile's shelf those come apart. The four orchestral
 * overviews (a symphony's education site, a philharmonic's instrument guide) are trusted sources and
 * score 0.85-0.9, while the Benedetti Foundation's violin course scores 0.8 because the charity is
 * six years old. Rank on reputation alone and a child who taps Violin gets one violin part followed
 * by four pages about orchestras, with every violin lesson pushed off the end. That is a subtler
 * version of the bug this function was written to fix: the right cabin, and still not the thing they
 * asked for.
 *
 * The fix uses a signal already in the data and needs no new field. A resource hand-tagged to four
 * tiles is, by the curator's own judgement, about none of them in particular; one tagged to a single
 * tile is about that tile. So specificity leads and trust breaks its ties.
 *
 * WHERE THE HEURISTIC IS WRONG: a narrow-but-mediocre resource tagged to one tile will outrank a
 * broad-but-excellent one, and a generic hub that nobody thought to cross-tag looks specific. Both
 * are curation errors that show up on the shelf rather than hiding, which is the failure mode to
 * prefer. It changes nothing for the great majority of entries, which stock exactly one tile.
 */
function bySpecificityThenReputation(a: CuratedResource, b: CuratedResource): number {
  if (a.pursuits.length !== b.pursuits.length) return a.pursuits.length - b.pursuits.length;
  return byReputationThenId(a, b);
}

/**
 * Every age-eligible resource stocking one browse tile, ranked.
 *
 * The wall's lookup. `curatedForCell` answers "what is in this part of the taxonomy", which is the
 * right question for the concierge and the wrong one for a tile: the taxonomy's cells and the
 * menu's tiles are different partitions, so a cell lookup hands Speaker Design the violin shelf.
 *
 * NO FALLBACK, DELIBERATELY. The obvious kindness here is to widen to the cabin when a pursuit
 * comes back empty, and it is the exact bug this function replaced — it cannot be distinguished
 * from a correct answer at the call site, so an untagged pursuit would look stocked forever.
 * Returning `[]` is the honest report, and `validateLibrary` makes reaching it a build failure.
 */
export function curatedForPursuit(
  lib: CuratedLibrary,
  pursuit: string,
  ageTiers: readonly AgeTier[],
  limit = MAX_DOCS,
): readonly CuratedResource[] {
  return lib
    .filter((r) => r.pursuits.includes(pursuit) && r.ageTiers.some((t) => ageTiers.includes(t)))
    .slice()
    .sort(bySpecificityThenReputation)
    .slice(0, limit);
}

/** Whether the library can answer this request from curated material (curated-first gate). */
export function covers(lib: CuratedLibrary, request: ConciergeRequest): boolean {
  return lib.some((r) => matchesRequest(r, request));
}

/** Immutable append — folds a (typically promoted) resource into the library. */
export function withResource(lib: CuratedLibrary, r: CuratedResource): CuratedLibrary {
  return [...lib, r];
}
