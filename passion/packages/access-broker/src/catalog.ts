// The OpportunityCatalog port + the in-package deterministic stub (spec §4.4). PURE + SYNCHRONOUS +
// NO NETWORK. The stub powers CI + LOOP_QA; the opt-in @gt100k/access-broker-live adapter implements
// the same port with (still fake) "live" data.
//
// DESIGN: the catalog is a dumb lookup — it filters ONLY by `cellKey` + `kind` (a domain×mode index).
// Every judgement gate (vetting, age-tier, stage, craft-floor, wellbeing) lives in the ENGINE
// (`brokerAccess`), never here — so the catalog stays a swappable data source and the gates stay in
// one auditable place.
import type { Opportunity, OpportunityKind } from "./model.js";
import { SEED_CATALOG } from "./__fixtures__/catalog.js";

export interface OpportunityCatalog {
  /** Pure, synchronous lookup by the spike's `cellKey` + the `kind` of access wanted. */
  search(q: { cellKey: string; kind: OpportunityKind }): readonly Opportunity[];
}

/**
 * Build an `OpportunityCatalog` over any list of opportunities. Results are returned in the source
 * order of `opportunities` (deterministic); the engine re-sorts by score, so no ordering is implied.
 */
export function makeCatalog(opportunities: readonly Opportunity[]): OpportunityCatalog {
  return {
    search(q) {
      return opportunities.filter((o) => o.cellKey === q.cellKey && o.kind === q.kind);
    },
  };
}

/** The deterministic in-package stub catalog over the full layered seed (§4.5). */
export const stubCatalog: OpportunityCatalog = makeCatalog(SEED_CATALOG);

export { SEED_CATALOG, CELL_AUDIO, CELL_GAMEDEV, CELL_CHESS } from "./__fixtures__/catalog.js";
