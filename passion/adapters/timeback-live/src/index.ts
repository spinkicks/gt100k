// src/index.ts — the REAL TimeBack adapter: a native-`fetch` `TimeBackClient` against a DOCUMENTED
// ASSUMED API shape. OPT-IN ONLY: nothing here is ever imported by a test (the hermetic parse tests
// import `./parse.js` only) and the gate never hits the network or needs `TIMEBACK_API_KEY`. Mirrors
// the concierge-live / tagger-tfy fetch/fail-safe split. NO REAL API YET — this is the ready-to-flip
// scaffold; every failure falls back to a SAFE empty snapshot, so a down/absent API never gates.
//
// DOCUMENTED ASSUMED PAYLOAD (pin the exact fields when the real API exists):
//   GET {baseURL}/students/{kidId}/signals    Authorization: Bearer {apiKey}
//   → { "asOf": "<ISO-8601>",
//       "subjects": [ { "subject": string, "mastery": 0..1, "discretionaryXp": >=0,
//                       "offered": boolean }, ... ] }
import type { TimeBackSnapshot } from "@gt100k/timeback";
import { parseSnapshot } from "./parse.js";

export { parseSnapshot } from "./parse.js";

export interface TimeBackConfig {
  readonly baseURL: string;
  readonly apiKey: string;
}

/**
 * Read the live-adapter config from the environment. NEVER called at import time or in any test — only
 * by the opt-in `timeback:live` script — so the CI gate needs no env. Throws if either var is missing
 * (a missing credential is an operator error at run time, not a silent live call).
 */
export function timeBackConfigFromEnv(env: NodeJS.ProcessEnv = process.env): TimeBackConfig {
  const baseURL = env["TIMEBACK_BASE_URL"];
  const apiKey = env["TIMEBACK_API_KEY"];
  if (!baseURL) throw new Error("TIMEBACK_BASE_URL is required for the live TimeBack adapter");
  if (!apiKey) throw new Error("TIMEBACK_API_KEY is required for the live TimeBack adapter");
  return { baseURL, apiKey };
}

/**
 * The REAL TimeBack client. `fetchSnapshot` GETs a kid's signals over native `fetch` and parses the
 * body via {@link parseSnapshot}. FAILS SAFE: any transport error, non-2xx status, unparseable JSON, or
 * malformed body yields the safe EMPTY snapshot (`{ kidId, asOf: epoch, subjects: [] }`) — never a throw
 * that escapes. The caller then gets an empty prior set (011 uses its blank priors); a prior can never
 * gate, so a failed fetch is harmless. Opt-in only — never constructed in a test.
 */
export class TimeBackClient {
  constructor(private readonly cfg: TimeBackConfig) {}

  async fetchSnapshot(kidId: string): Promise<TimeBackSnapshot> {
    const url = `${this.cfg.baseURL}/students/${encodeURIComponent(kidId)}/signals`;
    let res: Response;
    try {
      res = await fetch(url, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${this.cfg.apiKey}`,
        },
      });
    } catch {
      return parseSnapshot(kidId, null); // transport error → safe empty
    }
    if (!res.ok) return parseSnapshot(kidId, null); // non-2xx → safe empty
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      return parseSnapshot(kidId, null); // unparseable JSON → safe empty
    }
    return parseSnapshot(kidId, body);
  }
}
