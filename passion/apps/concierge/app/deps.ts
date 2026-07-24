// The default (STUB) port bundle the server route runs `runConcierge` over. Deterministic + offline,
// so `next build` and the LOOP_QA usability gate stay hermetic — no network, no model, no env.
// The opt-in real adapters (`@gt100k/concierge-live`, TFY + web) are wired ONLY in the route under
// `CONCIERGE_LIVE=1` via a dynamic import (see `app/live-deps.ts`), never here and never in a test.
import {
  stubDistress,
  stubFaithfulness,
  stubGenerator,
  stubHasher,
  stubModerator,
  stubReadability,
  stubRetriever,
  type ConciergeDeps,
} from "@gt100k/concierge";
import { SEED_CORPUS, SEED_LIBRARY } from "./seed.js";

/** Build the deterministic stub deps over the seeded synthetic library + web corpus. */
export function buildStubDeps(): ConciergeDeps {
  return {
    library: SEED_LIBRARY,
    moderator: stubModerator,
    distress: stubDistress,
    retriever: stubRetriever(SEED_CORPUS),
    generator: stubGenerator,
    faithfulness: stubFaithfulness,
    readability: stubReadability,
    hasher: stubHasher,
  };
}
