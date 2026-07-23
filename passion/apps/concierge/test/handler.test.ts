/**
 * CI test for the concierge app's PURE server handler (SC-10 groundwork, hermetic).
 *
 * The served DOM + the live `window.__qa` contract are verified by the LOOP_QA usability gate; here —
 * headless, no jsdom, no network, STUB deps only — we pin the wiring the `POST /ask` route runs and
 * the four canonical outcomes over the seeded synthetic library + web corpus:
 *   covered → answer from curated (no retrieval) · gap → grounded answer WITH citations ·
 *   distress → escalated (no text) · ungrounded → refused (cite-or-refuse).
 * `@gt100k/concierge-live` is NEVER imported here — the live path lives only in the route.
 */
import { describe, expect, it } from "vitest";
import { buildStubDeps } from "../app/deps.js";
import { handleAsk } from "../app/ask-handler.js";
import {
  SEED_COVERED_QUESTION,
  SEED_DISTRESS_QUESTION,
  SEED_GAP_QUESTION,
  SEED_UNGROUNDED_QUESTION,
} from "../app/seed.js";

describe("handleAsk (stub deps, seeded synthetic data)", () => {
  it("answers a COVERED question from the curated library", async () => {
    const res = await handleAsk({ message: SEED_COVERED_QUESTION }, buildStubDeps());
    expect(res.kind).toBe("answer");
    expect(res.resources?.map((r) => r.id)).toEqual(["res-chess-openings"]);
    expect(res.citations?.[0]?.url).toBe("https://www.khanacademy.org/chess-openings");
    expect(res.probe).toBeTruthy();
  });

  it("answers the seeded GAP question with grounded citations (harness + injection defense)", async () => {
    const res = await handleAsk({ message: SEED_GAP_QUESTION }, buildStubDeps());
    expect(res.kind).toBe("answer");
    // Grounded fact kept; the injection doc's imperative + spotlight markers never enter the answer.
    expect(res.text).toContain("Tardigrades can survive the vacuum of space");
    expect(res.text).toContain("water bears");
    expect(res.text?.toLowerCase()).not.toContain("ignore previous");
    expect(res.text).not.toContain("«untrusted-document»");
    // Two allowlisted docs cited; the unknown-host doc was dropped by the recomputed reputation floor.
    const urls = res.citations?.map((c) => c.url) ?? [];
    expect(urls).toContain("https://en.wikipedia.org/wiki/Tardigrade");
    expect(urls).toContain("https://en.wikipedia.org/wiki/Water_bear");
    expect(urls).not.toContain("https://sketchy.example.com/page");
    expect(res.citations).toHaveLength(2);
    expect(res.probe).toBeTruthy();
  });

  it("ESCALATES a seeded distress message before any retrieval/generation, with no answer text", async () => {
    const res = await handleAsk({ message: SEED_DISTRESS_QUESTION }, buildStubDeps());
    expect(res.kind).toBe("escalated");
    expect(res.text).toBeUndefined();
    expect(res.citations).toBeUndefined();
  });

  it("REFUSES an ungrounded answer (faithfulness gate — cite-or-refuse)", async () => {
    const res = await handleAsk({ message: SEED_UNGROUNDED_QUESTION }, buildStubDeps());
    expect(res.kind).toBe("refused");
    expect(res.reason).toBe("ungrounded");
    expect(res.text).toBeUndefined();
  });

  it("is deterministic — identical input yields a deep-equal response", async () => {
    const a = await handleAsk({ message: SEED_GAP_QUESTION }, buildStubDeps());
    const b = await handleAsk({ message: SEED_GAP_QUESTION }, buildStubDeps());
    expect(a).toEqual(b);
  });
});
