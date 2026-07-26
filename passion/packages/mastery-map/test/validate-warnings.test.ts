/**
 * The validator's WARNING rules (spec §5). Warnings are surfaced to a guide and never block, so
 * every test here asserts two things: the warning fires, and it did NOT become an error.
 */
import { describe, expect, it } from "vitest";

import { cleanMap, milestone, withMilestones } from "../src/__fixtures__/builders.js";
import { validateMap } from "../src/validate.js";
import type { MasteryMap } from "../src/model.js";

const warnings = (m: MasteryMap, now?: string): readonly string[] =>
  validateMap(m, now).warnings.map((w) => w.code);
const errors = (m: MasteryMap, now?: string): readonly string[] =>
  validateMap(m, now).errors.map((e) => e.code);

/** A milestone whose ordering is anchored to a published syllabus, so W2 stays quiet. */
const anchored = (over = {}) =>
  milestone({
    ordering: {
      reason: "The federation's own rating syllabus puts this first.",
      basis: "syllabus",
      sources: [{ authors: "A Federation", year: 2024, url: "https://example.org/syllabus" }],
    },
    ...over,
  });

describe("validateMap, warnings", () => {
  it("a clean anchored map warns about nothing", () => {
    expect(warnings(withMilestones(anchored()))).toEqual([]);
  });

  it("W1 flags a map mostly resting on the model's own reasoning", () => {
    // Two of three on `model` is 67%, over the 34% default.
    const m = withMilestones(anchored({ id: "a" }), milestone({ id: "b" }), milestone({ id: "c" }));
    expect(warnings(m)).toContain("W1_MODEL_HEAVY");
    expect(errors(m)).not.toContain("W1_MODEL_HEAVY");
  });

  it("W1 stays quiet when most milestones are externally supported", () => {
    const m = withMilestones(anchored({ id: "a" }), anchored({ id: "b" }), milestone({ id: "c" }));
    expect(warnings(m)).not.toContain("W1_MODEL_HEAVY");
  });

  it("W2 flags a map with nothing anchored to a syllabus", () => {
    expect(warnings(withMilestones(milestone()))).toContain("W2_NO_SYLLABUS");
  });

  describe("W3 a branch below expert entry", () => {
    it("fires, and carries the unreachability caveat in the text a guide reads", () => {
      const m = withMilestones(anchored({ modes: ["build"], stageFloor: "S1_IGNITION" }));
      const w = validateMap(m).warnings.find((x) => x.code === "W3_EARLY_BRANCH");
      expect(w).toBeDefined();
      // The caveat must travel with the message. A guide reads this, not the spec.
      expect(w?.message).toMatch(/S2_FOUNDATIONS/);
      expect(w?.message).toMatch(/chosen_challenge/);
    });

    it("is NEVER an error, because no branch is reachable at any height today", () => {
      const m = withMilestones(anchored({ modes: ["build"], stageFloor: "S1_IGNITION" }));
      expect(errors(m)).not.toContain("W3_EARLY_BRANCH");
    });

    it("does not fire for a trunk milestone, which has no modes", () => {
      const m = withMilestones(anchored({ modes: [], stageFloor: "S1_IGNITION" }));
      expect(warnings(m)).not.toContain("W3_EARLY_BRANCH");
    });
  });

  it("W4 flags a map that is nearly all branch", () => {
    const m = withMilestones(
      anchored({ id: "a", modes: ["build"], stageFloor: "S3_AUTHORSHIP" }),
      anchored({ id: "b", modes: ["build"], stageFloor: "S3_AUTHORSHIP" }),
      anchored({ id: "c", modes: ["investigate"], stageFloor: "S3_AUTHORSHIP" }),
    );
    expect(warnings(m)).toContain("W4_THIN_TRUNK");
  });

  describe("W5 staleness", () => {
    it("fires when the last re-check is older than the threshold", () => {
      const m = cleanMap({
        milestones: [anchored()],
        revalidatedAt: "2026-01-01T00:00:00.000Z",
      });
      expect(warnings(m, "2026-07-26T00:00:00.000Z")).toContain("W5_STALE");
    });

    it("does not fire for a recent re-check", () => {
      const m = cleanMap({
        milestones: [anchored()],
        revalidatedAt: "2026-07-01T00:00:00.000Z",
      });
      expect(warnings(m, "2026-07-26T00:00:00.000Z")).not.toContain("W5_STALE");
    });

    /** The engine is pure and never reads a clock. With no `now` supplied it cannot judge age, and
        must not guess. */
    it("cannot fire when no clock is supplied, because the engine never reads one", () => {
      const m = cleanMap({ milestones: [anchored()], revalidatedAt: "2020-01-01T00:00:00.000Z" });
      expect(warnings(m)).not.toContain("W5_STALE");
    });
  });

  describe("W6 a consumption opener", () => {
    it("fires on a capability that opens with a consumption verb", () => {
      const m = withMilestones(
        anchored({ capability: "Read the annotation guide", demonstration: "An annotation" }),
      );
      expect(warnings(m)).toContain("W6_CONSUMPTION_VERB");
    });

    /**
     * The whole reason this is a warning. An error-level verb list would reject the analytic mode,
     * which is the highest-yield one by the design's own citation.
     */
    it("is a warning and not an error on a legitimate analytic capability", () => {
      const m = withMilestones(
        anchored({
          capability: "Review a peer's game and publish the annotation",
          demonstration: "A published annotation of a peer's game",
        }),
      );
      expect(warnings(m)).toContain("W6_CONSUMPTION_VERB");
      expect(errors(m)).toEqual([]);
    });
  });
});
