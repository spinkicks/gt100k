/**
 * App smoke test (node env, no jsdom): the pure `window.__qa.state()` snapshot the LOOP_QA harness
 * reads, driven by the SAME seeded handler outcomes the served route produces. This pins the diff the
 * gate relies on — a seeded gap answer must read as `{ lastKind: "answer", citationCount: 2 }`, a
 * distress message as `{ lastKind: "escalated", citationCount: 0 }` — without a browser.
 */
import { describe, expect, it } from "vitest";
import { buildStubDeps } from "../app/deps.js";
import { handleAsk } from "../app/ask-handler.js";
import { buildQaState } from "../app/qa.js";
import { SEED_DISTRESS_QUESTION, SEED_GAP_QUESTION } from "../app/seed.js";

describe("buildQaState", () => {
  it("reports null before any ask", () => {
    expect(buildQaState(null)).toEqual({ lastKind: null, citationCount: 0 });
  });

  it("reflects the seeded GAP answer — kind 'answer' with its citation count (primaryAction)", async () => {
    const res = await handleAsk({ message: SEED_GAP_QUESTION }, buildStubDeps());
    expect(buildQaState(res)).toEqual({ lastKind: "answer", citationCount: 2 });
  });

  it("reflects the seeded DISTRESS path — kind 'escalated', no citations", async () => {
    const res = await handleAsk({ message: SEED_DISTRESS_QUESTION }, buildStubDeps());
    expect(buildQaState(res)).toEqual({ lastKind: "escalated", citationCount: 0 });
  });
});
