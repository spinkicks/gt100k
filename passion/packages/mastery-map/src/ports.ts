/**
 * The ports (spec §4). The engine stays pure: everything that would touch a network sits behind one
 * of these, with a deterministic stub for CI, exactly as `ProjectBriefGenerator` already does in the
 * specialization planner.
 */
import type { AgeTier, CuratedResource } from "@gt100k/concierge";
import type { DomainPath, WorkMode } from "@gt100k/two-axis-tagging";

import type { MasteryMap } from "./model.js";

export interface MapGenerator {
  generate(ctx: MapContext): Promise<MasteryMap>;
}

export interface MapContext {
  readonly domainPath: DomainPath;
  /** The modes this domain affords. Branches may claim these and nothing else. */
  readonly modes: readonly WorkMode[];
  /** Plural for the same reason `MasteryMap.ageBands` is: a map spans S1 to S4, so it spans tiers.
      Concierge's `AgeTier`, deliberately NOT a fourth local copy of "6-8" | "9-11" | "12-14". */
  readonly ageBands: readonly AgeTier[];
  /** Drawn from the concierge's curated library, whose entries a human approved in its vet queue.
      The generator ATTACHES, never fetches: a generator that fetched its own resources would walk
      straight past the one place in this pipeline where a person checks what a child will see. So
      be precise about the claim: the ordering is software-decided, the resource safety is not. */
  readonly resources: readonly CuratedResource[];
}

export interface MapStore {
  /** Most specific match wins, and `get` performs the fallback itself so no caller reimplements
      it: a spike on `["games-strategy", "chess"]` resolves to the chess map when one exists and to
      the `["games-strategy"]` map when it does not. The two are never merged, because a merged DAG
      is one nobody authored and nobody validated.

      THIS IS THE ACCESSOR A PLAN CONSUMES, so it hands back only maps that could be put into use
      (spec §8). A map carrying an error is not returned at all, and the widening fallback widens on
      ABSENCE and never on invalidity: answering a question about chess with a map about games in
      general, because the chess map has a problem, would be a silent swap the caller cannot see. */
  get(domainPath: DomainPath): Promise<MasteryMap | null>;
  /** The same resolution with no filter at all, for the review screen. A draft nobody can see is a
      draft nobody can fix, so the surface that exists to correct a map has to be handed the map in
      whatever state it is in. Never call this on a path that leads to a child. */
  getForReview(domainPath: DomainPath): Promise<MasteryMap | null>;
  /** Optimistic concurrency: rejects unless the stored map's `version` is exactly `map.version - 1`.
      Two guides editing the same map is a real case, and last-write-wins would silently discard one
      of them. On rejection the caller re-reads and re-applies. */
  put(map: MasteryMap): Promise<void>;
  listDrafts(): Promise<readonly MasteryMap[]>;
}
