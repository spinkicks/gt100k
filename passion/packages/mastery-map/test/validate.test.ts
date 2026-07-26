/**
 * The validator's ERROR rules (spec §5). One test per rule: a violating map reports exactly that
 * code, and a clean map reports nothing.
 *
 * The validator is the gate. No human certifies domain correctness here, because nobody available
 * to us can, so these rules are the whole of the machine-checkable claim a published map makes.
 */
import { describe, expect, it } from "vitest";

import { validateMap } from "../src/validate.js";
import { cleanMap, withMilestones, milestone } from "../src/__fixtures__/builders.js";

const codes = (m: ReturnType<typeof cleanMap>): readonly string[] =>
  validateMap(m).errors.map((e) => e.code);

describe("validateMap, errors", () => {
  it("a clean map reports no errors at all", () => {
    expect(validateMap(cleanMap()).errors).toEqual([]);
  });

  describe("E1 the requires graph is a DAG", () => {
    it("catches a self-edge", () => {
      const m = withMilestones(milestone({ id: "a", requires: ["a"] }));
      expect(codes(m)).toContain("E1_CYCLE");
    });

    it("catches a two-node cycle", () => {
      const m = withMilestones(
        milestone({ id: "a", requires: ["b"] }),
        milestone({ id: "b", requires: ["a"] }),
      );
      expect(codes(m)).toContain("E1_CYCLE");
    });

    it("catches a longer cycle", () => {
      const m = withMilestones(
        milestone({ id: "a", requires: ["c"] }),
        milestone({ id: "b", requires: ["a"] }),
        milestone({ id: "c", requires: ["b"] }),
      );
      expect(codes(m)).toContain("E1_CYCLE");
    });

    it("catches a requires id that resolves to nothing", () => {
      const m = withMilestones(milestone({ id: "a", requires: ["ghost"] }));
      expect(codes(m)).toContain("E1_DANGLING");
    });
  });

  describe("E2 capability and demonstration are present", () => {
    it("catches an empty capability", () => {
      expect(codes(withMilestones(milestone({ capability: "   " })))).toContain("E2_EMPTY");
    });

    it("catches an empty demonstration", () => {
      expect(codes(withMilestones(milestone({ demonstration: "" })))).toContain("E2_EMPTY");
    });
  });

  describe("E3 capability references the artefact in demonstration", () => {
    it("catches a capability that names nothing you made", () => {
      const m = withMilestones(
        milestone({
          capability: "Watch the introductory series",
          demonstration: "An annotated endgame study",
        }),
      );
      expect(codes(m)).toContain("E3_NO_ARTEFACT");
    });

    /**
     * The rule this replaced was a banned-verb list, which rejected exactly this sentence. The
     * analytic mode is the highest-yield one by the design's own citation (Charness et al. found
     * solitary study predicts tournament rating better than tournament play), so a rule that
     * error-rejects it is worse than no rule.
     */
    it("PASSES an analytic capability that a banned-verb list would have rejected", () => {
      const m = withMilestones(
        milestone({
          capability: "Review a peer's game and publish the annotation",
          demonstration: "A published annotation of a peer's game",
        }),
      );
      expect(codes(m)).not.toContain("E3_NO_ARTEFACT");
    });

    it("ignores stopwords, so overlap on 'a' and 'the' alone is not enough", () => {
      const m = withMilestones(
        milestone({ capability: "Do the thing", demonstration: "A recorded performance" }),
      );
      expect(codes(m)).toContain("E3_NO_ARTEFACT");
    });
  });

  describe("E4 sources match the basis", () => {
    it("catches a research basis with no sources", () => {
      const m = withMilestones(
        milestone({ ordering: { reason: "r", basis: "research", sources: [] } }),
      );
      expect(codes(m)).toContain("E4_SOURCES");
    });

    it("catches a model basis that carries sources anyway", () => {
      const m = withMilestones(
        milestone({
          ordering: {
            reason: "r",
            basis: "model",
            sources: [{ authors: "Someone", year: 2020, url: "https://example.org" }],
          },
        }),
      );
      expect(codes(m)).toContain("E4_SOURCES");
    });

    it("accepts a model basis with no sources, which is the honest shape", () => {
      const m = withMilestones(
        milestone({ ordering: { reason: "r", basis: "model", sources: [] } }),
      );
      expect(codes(m)).not.toContain("E4_SOURCES");
    });
  });

  describe("E5 resources are age-appropriate and have provenance", () => {
    it("catches a resource whose tiers miss every band the map claims", () => {
      const m = withMilestones(
        milestone({
          resources: [
            {
              id: "r1",
              title: "t",
              url: "https://example.org",
              domainPath: ["games-strategy"],
              affordedModes: ["investigate"],
              reputation: 0.9,
              ageTiers: ["12-14"],
              provenance: "p",
            },
          ],
        }),
      );
      // cleanMap claims ["6-8"], so a 12-14 only resource covers nothing it claims.
      expect(codes(m)).toContain("E5_AGE");
    });

    it("accepts a resource covering AT LEAST ONE claimed band, not all of them", () => {
      const m = withMilestones(
        milestone({
          resources: [
            {
              id: "r1",
              title: "t",
              url: "https://example.org",
              domainPath: ["games-strategy"],
              affordedModes: ["investigate"],
              reputation: 0.9,
              ageTiers: ["6-8", "12-14"],
              provenance: "p",
            },
          ],
        }),
      );
      expect(codes(m)).not.toContain("E5_AGE");
    });
  });

  it("E6 catches a prerequisite gated later than the thing it unlocks", () => {
    const m = withMilestones(
      milestone({ id: "early", stageFloor: "S3_AUTHORSHIP" }),
      milestone({ id: "late", requires: ["early"], stageFloor: "S1_IGNITION" }),
    );
    expect(codes(m)).toContain("E6_FLOOR_ORDER");
  });

  it("E7 catches a branch claiming a mode the domain does not afford", () => {
    const m = withMilestones(milestone({ modes: ["perform"] }));
    // cleanMap affords ["investigate", "build"].
    expect(codes(m)).toContain("E7_MODE");
  });

  describe("E8 banned field names", () => {
    it("catches a field called rating", () => {
      const m = withMilestones(milestone({}));
      const dirty = { ...m, milestones: [{ ...m.milestones[0]!, rating: 1800 }] };
      expect(validateMap(dirty as unknown as typeof m).errors.map((e) => e.code)).toContain(
        "E8_BANNED_KEY",
      );
    });

    /** The scan is over KEYS and never over values. A chess map talking about rating bands is
        legitimate domain language and must survive. */
    it("PASSES prose that merely mentions a rating", () => {
      const m = withMilestones(
        milestone({
          capability: "Reach a rating band with a recorded game",
          demonstration: "A recorded rated game",
        }),
      );
      expect(codes(m)).not.toContain("E8_BANNED_KEY");
    });

    it("catches a gamification key such as streak", () => {
      const m = withMilestones(milestone({}));
      const dirty = { ...m, milestones: [{ ...m.milestones[0]!, streak: 3 }] };
      expect(validateMap(dirty as unknown as typeof m).errors.map((e) => e.code)).toContain(
        "E8_BANNED_KEY",
      );
    });
  });

  it("E9 catches a forecast in a named prose field", () => {
    const m = withMilestones(
      milestone({
        ordering: {
          reason: "Most children reach this within 2 years of starting",
          basis: "model",
          sources: [],
        },
      }),
    );
    expect(codes(m)).toContain("E9_FORECAST");
  });

  it("reports EVERY problem rather than stopping at the first", () => {
    const m = withMilestones(
      milestone({ id: "a", requires: ["ghost"], capability: "", demonstration: "" }),
    );
    const found = codes(m);
    expect(found).toContain("E1_DANGLING");
    expect(found).toContain("E2_EMPTY");
    expect(found.length).toBeGreaterThan(1);
  });
});
