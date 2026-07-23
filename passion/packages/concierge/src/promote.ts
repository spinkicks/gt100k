// Async cache → vet-queue → promote (spec §3.2 stage 10, [D7]). Served open-web docs are cached
// provisionally, queued for a HUMAN vet, and — only on approval — folded into the curated library
// with content provenance. This is the compounding lever (A6): every promoted resource shrinks the
// need for live open-web retrieval, so the same need later resolves CURATED (SC-8). This stage runs
// ASYNC and NEVER blocks the live answer (stages 1–9); it is a pure, deterministic value transform
// here — the real reviewer surface + provenance signer are shared later (out of scope, spec §2).
import {
  inferDomainPaths,
  withResource,
  type CuratedLibrary,
} from "./library.js";
import type { AgeTier, CuratedResource, RetrievedDoc } from "./model.js";
import type { CacheDraft } from "./pipeline.js";
import type { Hasher } from "./ports.js";
import { reputationOf } from "./safety.js";
import type { DomainPath, WorkMode } from "@gt100k/two-axis-tagging";

/** A vet decision on a queued entry — a human approves it into the library or rejects it. */
export type VetDecision = "approve" | "reject";

/**
 * A provisionally-cached served doc awaiting human vetting. `provenance` is a stable content
 * digest stamped at cache time ({@link toCacheEntry}); `ageTier` is the tier the doc was served
 * (and thus child-safe-filtered) at, so promotion stays age-correct (a doc vetted at `12-14` is
 * never silently curated for `6-8`).
 */
export interface CacheEntry {
  readonly doc: RetrievedDoc;
  readonly query: string;
  readonly ageTier: AgeTier;
  readonly provenance: string;
}

/** An immutable vet queue value. */
export type VetQueue = readonly CacheEntry[];

/** The default (domain-agnostic) work modes a promoted open-web reference affords for discovery seeding. */
export const PROMOTED_MODES: readonly WorkMode[] = ["investigate", "explain"];

/**
 * Turn a served {@link CacheDraft} (stage-10 side value from `runConcierge`) into a queue-ready
 * {@link CacheEntry}, stamping provenance = `hasher.hash(`${url}\n${text}`)`. The caller supplies
 * the request's `ageTier` (the tier the doc was served + filtered at) so promotion is age-correct.
 * Deterministic: identical draft + hasher ⇒ identical provenance.
 */
export function toCacheEntry(draft: CacheDraft, ageTier: AgeTier, hasher: Hasher): CacheEntry {
  return {
    doc: draft.doc,
    query: draft.query,
    ageTier,
    provenance: hasher.hash(`${draft.doc.url}\n${draft.doc.text}`),
  };
}

/** Immutable append of a cached entry onto the vet queue. */
export function enqueue(queue: VetQueue, entry: CacheEntry): VetQueue {
  return [...queue, entry];
}

/**
 * Infer the domain path to tag a promoted resource with, from the query that surfaced it (then its
 * title). Returns `undefined` when neither yields a taxonomy path — such an entry cannot be placed
 * (the slug inference is a known Task-2 simplification), so it is NOT curated (see `promote`).
 */
function inferResourcePath(entry: CacheEntry): DomainPath | undefined {
  return inferDomainPaths(entry.query)[0] ?? inferDomainPaths(entry.doc.title)[0];
}

/** Build the curated resource a promoted entry becomes (reputation RECOMPUTED from the URL, never trusted). */
function toResource(entry: CacheEntry, domainPath: DomainPath): CuratedResource {
  return {
    id: `promoted:${entry.provenance}`,
    title: entry.doc.title,
    url: entry.doc.url,
    domainPath,
    affordedModes: PROMOTED_MODES,
    reputation: reputationOf(entry.doc.url),
    ageTiers: [entry.ageTier],
    provenance: entry.provenance,
  };
}

/** The library + queue after a vet decision. */
export interface PromoteResult {
  readonly library: CuratedLibrary;
  readonly queue: VetQueue;
}

/**
 * Apply a human vet `decision` to a queued `entry`: the entry always leaves the queue; on
 * `"approve"` (and only when the entry can be topically classified) it is folded into the library
 * as a {@link CuratedResource} tagged by (domain × mode) with its recorded provenance. `"reject"`
 * (or an un-classifiable approval) leaves the library untouched. Pure + immutable — never blocks
 * the live pipeline ([D7]). Takes the queue so the vetted entry can be removed from it.
 */
export function promote(
  library: CuratedLibrary,
  queue: VetQueue,
  entry: CacheEntry,
  decision: VetDecision,
): PromoteResult {
  const nextQueue = queue.filter((e) => e.provenance !== entry.provenance);
  if (decision === "reject") return { library, queue: nextQueue };
  const path = inferResourcePath(entry);
  if (!path) return { library, queue: nextQueue }; // cannot classify → do not pollute the library
  return { library: withResource(library, toResource(entry, path)), queue: nextQueue };
}
