// OPT-IN real deps (`CONCIERGE_LIVE=1`) — makes REAL TrueFoundry + Wikipedia calls. Requires
// `TFY_API_KEY`. This module is the ONLY place that imports `@gt100k/concierge-live`, and it is
// reached exclusively via a dynamic import inside the server route — NEVER imported by a test and
// NEVER on the default (stub) path, so the gate stays hermetic.
//
// The real ports that FIT the synchronous safety-gate interfaces are the generator + retriever
// (async); moderation / distress / faithfulness stay deterministic stubs (the sync ports can't be
// network-backed — see the adapter's decisions.md), matching the `concierge:live` script.
import {
  stubDistress,
  stubFaithfulness,
  stubHasher,
  stubModerator,
  stubReadability,
  type ConciergeDeps,
} from "@gt100k/concierge";
import { AllowlistRetriever, TfyGenerator, tfyConfigFromEnv } from "@gt100k/concierge-live";
import { SEED_LIBRARY } from "./seed.js";

/** Build the opt-in live deps (TFY generation + allowlist web retrieval + stub safety gates). */
export function buildLiveDeps(): ConciergeDeps {
  const cfg = tfyConfigFromEnv();
  return {
    library: SEED_LIBRARY,
    moderator: stubModerator,
    distress: stubDistress,
    retriever: new AllowlistRetriever(),
    generator: new TfyGenerator(cfg),
    faithfulness: stubFaithfulness,
    readability: stubReadability,
    hasher: stubHasher,
  };
}
