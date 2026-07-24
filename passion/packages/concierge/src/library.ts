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
import { MAX_DOCS, type ConciergeRequest, type CuratedResource } from "./model.js";

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
  const inferred = inferDomainPaths(request.message);
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
export function resolve(lib: CuratedLibrary, request: ConciergeRequest): readonly CuratedResource[] {
  return lib
    .filter((r) => matchesRequest(r, request))
    .slice()
    .sort(byReputationThenId)
    .slice(0, MAX_DOCS);
}

/** Whether the library can answer this request from curated material (curated-first gate). */
export function covers(lib: CuratedLibrary, request: ConciergeRequest): boolean {
  return lib.some((r) => matchesRequest(r, request));
}

/** Immutable append — folds a (typically promoted) resource into the library. */
export function withResource(lib: CuratedLibrary, r: CuratedResource): CuratedLibrary {
  return [...lib, r];
}
