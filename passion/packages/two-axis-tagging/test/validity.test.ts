import { describe, it, expect } from "vitest";
import {
  krippendorffAlphaNominal,
  topicTrust,
  applyTrust,
  ALPHA_BAR,
  createReviewQueue,
} from "../src/validity.js";
import { DISAGREE_UNITS, PERFECT_UNITS } from "../src/__fixtures__/rater-fixture.js";
import { resolveEngagedModes } from "../src/resolver.js";
import { RESOLVER_CASES } from "../src/__fixtures__/resolver-cases.js";

describe("krippendorff alpha (nominal)", () => {
  it("matches the hand-verified golden value", () => {
    expect(krippendorffAlphaNominal(DISAGREE_UNITS)).toBeCloseTo(0.5333, 3);
  });
  it("is 1.0 on perfect agreement", () => {
    expect(krippendorffAlphaNominal(PERFECT_UNITS)).toBeCloseTo(1.0, 6);
  });
  it("ALPHA_BAR gates trust", () => {
    expect(topicTrust(0.5333)).toBe("PROVISIONAL");
    expect(topicTrust(ALPHA_BAR)).toBe("TRUSTED");
    expect(topicTrust(1.0)).toBe("TRUSTED");
  });
});

describe("applyTrust wires the gate to an artifact", () => {
  it("promotes only above ALPHA_BAR", () => {
    const a = { tagStatus: "PROVISIONAL" as const };
    expect(applyTrust(a, 0.5333).tagStatus).toBe("PROVISIONAL");
    expect(applyTrust(a, 1.0).tagStatus).toBe("TRUSTED");
  });
});

describe("review queue", () => {
  it("enqueues and resolves", () => {
    const q = createReviewQueue();
    q.enqueue({ id: "a1", reason: "low-confidence" });
    expect(q.list()).toHaveLength(1);
    q.resolve("a1", "promoted");
    expect(q.list()).toHaveLength(0);
  });

  // SC-4: an ambiguous action the rule table can't resolve is marked `unresolved` and enqueued for
  // review — never guessed. This wires the resolver's `unresolved` result into the review queue.
  it("routes an unresolved resolver result to the queue (SC-4)", () => {
    const c = RESOLVER_CASES.find((x) => x.name === "unknown action → unresolved");
    expect(c).toBeDefined();
    const r = resolveEngagedModes(c!.artifact, c!.action);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("unresolved");

    const q = createReviewQueue();
    if (!r.ok && r.reason === "unresolved") {
      q.enqueue({ id: c!.action.artifactId, reason: "unresolved" });
    }
    expect(q.list()).toEqual([{ id: "synth-01", reason: "unresolved" }]);
  });
});
