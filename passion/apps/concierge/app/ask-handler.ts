// The pure server-side handler: stamp a `ConciergeRequest` from the child's message + server-supplied
// age tier, run the full 10-stage pipeline over the given ports, and return just the
// `ConciergeResponse` the surface serves. `now` is fixed (deterministic) so identical requests yield
// identical responses — the property the LOOP_QA gate relies on. Kept pure + dep-injected so the CI
// test drives it headless with stub deps (no network, no Next runtime).
import { runConcierge, type AgeTier, type ConciergeDeps, type ConciergeResponse } from "@gt100k/concierge";
import { SEED_AGE_TIER, SEED_KID_ID, SEED_SESSION_ID } from "./seed.js";

export interface AskInput {
  readonly message: string;
  readonly ageTier?: AgeTier;
  readonly sessionId?: string;
  readonly kidId?: string;
}

/** Deterministic clock for the served pipeline (never `Date.now()` — keeps responses reproducible). */
const FIXED_NOW = 0;

/** Run the concierge pipeline for one message; returns the servable `ConciergeResponse`. */
export async function handleAsk(input: AskInput, deps: ConciergeDeps): Promise<ConciergeResponse> {
  const { response } = await runConcierge(
    {
      kidId: input.kidId ?? SEED_KID_ID,
      ageTier: input.ageTier ?? SEED_AGE_TIER,
      message: input.message,
      sessionId: input.sessionId ?? SEED_SESSION_ID,
    },
    deps,
    FIXED_NOW,
  );
  return response;
}
