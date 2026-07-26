/**
 * The validator's ERROR rules (spec §5, plus rule 10 which review added). One test per rule: a
 * violating map reports exactly that code, and a clean map reports nothing.
 *
 * The validator is the gate. No human certifies domain correctness here, because nobody available
 * to us can, so these rules are the whole of the machine-checkable claim a published map makes.
 */
import type { Source } from "@gt100k/research";
import { describe, expect, it } from "vitest";

import { validateMap } from "../src/validate.js";
import { cleanMap, withMilestones, milestone } from "../src/__fixtures__/builders.js";
import type { MasteryMap } from "../src/model.js";

const codes = (m: MasteryMap): readonly string[] => validateMap(m).errors.map((e) => e.code);

const SOURCE: Source = { authors: "Someone", year: 2020, url: "https://example.org" };

const withReason = (reason: string): MasteryMap =>
  withMilestones(milestone({ ordering: { reason, basis: "model", sources: [] } }));

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

    /**
     * The first way this rule was defeated. Splitting on non-alphanumerics turns "a peer's game"
     * into `peer`, `s`, `game`, and a bare `s` is not a stopword, so any two sentences that each
     * held one possessive shared a content word and the rule passed on nothing at all. These two
     * sentences have no real overlap and the rule has to say so.
     */
    it("is not defeated by an apostrophe leaving a bare 's' in both sentences", () => {
      const m = withMilestones(
        milestone({
          capability: "Read a grandmaster's opening book",
          demonstration: "A student's finished endgame drill",
        }),
      );
      expect(codes(m)).toContain("E3_NO_ARTEFACT");
    });

    /**
     * The second. A demonstration made only of stopwords left the artefact set empty, which used to
     * SKIP the rule, so the emptiest possible demonstration switched off the check it exists to
     * feed. Rule 2 does not catch it either: the field is not blank, so this passed everything.
     */
    it("fails a demonstration naming no content word rather than skipping the rule", () => {
      const m = withMilestones(milestone({ capability: "Do the thing", demonstration: "The one" }));
      expect(codes(m)).toContain("E3_NO_ARTEFACT");
      expect(codes(m)).not.toContain("E2_EMPTY");
    });

    /**
     * A known false POSITIVE, kept on purpose and documented in `words()`. There is no stemming
     * here, so `compose` and `composition` are different words to this rule and the same word to
     * everyone else. A stemmer would fix this sentence and would also make `play` match `player`
     * and `rate` match `rating`, which widens an error-level gate into waving through milestones it
     * exists to catch. A rejected author rewords a demonstration in a sentence; a milestone waved
     * through is one nobody looks at again.
     */
    it("has no stemmer, so a shared root that is not a shared word does not count", () => {
      const m = withMilestones(
        milestone({ capability: "Compose a fugue", demonstration: "A finished composition" }),
      );
      expect(codes(m)).toContain("E3_NO_ARTEFACT");
    });
  });

  describe("E4 sources match the basis", () => {
    it("catches a research basis with no sources", () => {
      const m = withMilestones(
        milestone({ ordering: { reason: "r", basis: "research", sources: [] } }),
      );
      expect(codes(m)).toContain("E4_MISSING_SOURCES");
    });

    it("catches a model basis that carries sources anyway", () => {
      const m = withMilestones(
        milestone({ ordering: { reason: "r", basis: "model", sources: [SOURCE] } }),
      );
      expect(codes(m)).toContain("E4_SOURCES_ON_MODEL_BASIS");
    });

    /**
     * Two different faults with two different fixes. "You owe a citation" and "you claimed support
     * you had already said you did not have" are not the same finding, and one code for both left
     * every caller, the review screen included, unable to tell them apart.
     */
    it("gives the two faults their own codes", () => {
      const missing = withMilestones(
        milestone({ ordering: { reason: "r", basis: "research", sources: [] } }),
      );
      const extra = withMilestones(
        milestone({ ordering: { reason: "r", basis: "model", sources: [SOURCE] } }),
      );
      expect(codes(missing)).not.toContain("E4_SOURCES_ON_MODEL_BASIS");
      expect(codes(extra)).not.toContain("E4_MISSING_SOURCES");
    });

    it("accepts a model basis with no sources, which is the honest shape", () => {
      const m = withMilestones(
        milestone({ ordering: { reason: "r", basis: "model", sources: [] } }),
      );
      expect(codes(m).filter((c) => c.startsWith("E4_"))).toEqual([]);
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
      expect(codes(m)).toContain("E5_AGE_BAND_GAP");
    });

    /** A resource with no provenance is a different fault from one pitched at the wrong ages, and
        reporting it under a code named for the age gap sent a guide looking at the wrong thing. */
    it("catches a resource with no provenance under its own code, not the age one", () => {
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
              ageTiers: ["6-8"],
              provenance: "   ",
            },
          ],
        }),
      );
      expect(codes(m)).toContain("E5_MISSING_PROVENANCE");
      expect(codes(m)).not.toContain("E5_AGE_BAND_GAP");
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
      expect(codes(m)).not.toContain("E5_AGE_BAND_GAP");
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

    /** The review screen places a problem at the milestone it names, so a scan that named none
        pushed every banned key to the top of the card, away from the milestone carrying it. */
    it("names the milestone a banned key sits on", () => {
      const m = withMilestones(milestone({ id: "m-with-rating" }));
      const dirty = { ...m, milestones: [{ ...m.milestones[0]!, rating: 1800 }] };
      const found = validateMap(dirty as unknown as typeof m).errors.filter(
        (e) => e.code === "E8_BANNED_KEY",
      );
      expect(found).toHaveLength(1);
      expect(found[0]?.milestoneId).toBe("m-with-rating");
    });

    it("names no milestone for a banned key on the map shell, because it concerns none", () => {
      const dirty = { ...cleanMap(), streak: 3 };
      const found = validateMap(dirty as unknown as MasteryMap).errors.filter(
        (e) => e.code === "E8_BANNED_KEY",
      );
      expect(found).toHaveLength(1);
      expect(found[0]?.milestoneId).toBeUndefined();
    });

    it("reports a banned key once, not once per pass over the map", () => {
      const m = withMilestones(milestone({ id: "a" }), milestone({ id: "b" }));
      const dirty = { ...m, milestones: [{ ...m.milestones[0]!, rating: 1800 }, m.milestones[1]!] };
      const found = validateMap(dirty as unknown as typeof m).errors.filter(
        (e) => e.code === "E8_BANNED_KEY",
      );
      expect(found).toHaveLength(1);
    });
  });

  describe("E9 no forecast in the named prose fields", () => {
    /** Each of these names a time by which a child should have arrived, which is what turns into a
        quota. The last four were invisible to the first version of the rule, which required a
        digit, so "by age 10" was caught and "by age ten" was not. */
    const FORECASTS = [
      "Most children reach this within 2 years of starting.",
      "A child who starts early is usually here by age ten.",
      "Expect to be here within six months of the first lesson.",
      "Most are playing at this level by their eleventh birthday.",
      "A child on this path arrives by the end of Year 6.",
    ];

    for (const reason of FORECASTS) {
      it(`catches "${reason}"`, () => {
        expect(codes(withReason(reason))).toContain("E9_FORECAST");
      });
    }

    /**
     * Neither of these is a forecast. One is how often a document is reissued and the other is a
     * quantity of practice somebody else measured, and the first version of the rule rejected both:
     * an error-level rule blocking honest domain prose costs more than a missed forecast, because
     * the prose is what a guide is here to read.
     */
    const NOT_FORECASTS = [
      "The syllabus is revised in 5 year cycles, so this is checked against the current edition.",
      "Charness and colleagues put the expert and intermediate profiles apart after 10 years of practice.",
    ];

    for (const reason of NOT_FORECASTS) {
      it(`leaves "${reason}" alone`, () => {
        expect(codes(withReason(reason))).not.toContain("E9_FORECAST");
      });
    }

    it("reads readinessNote and practice descriptions, not only the ordering reason", () => {
      const note = withMilestones(
        milestone({
          opportunities: [
            {
              kind: "competition",
              description: "Local clubs run these.",
              readinessNote: "Most entrants are ready by age twelve.",
              stageFloor: "S1_IGNITION",
            },
          ],
        }),
      );
      const practice = withMilestones(
        milestone({
          practice: [
            { title: "Daily reps", description: "This pays off within six weeks.", solitary: true },
          ],
        }),
      );
      expect(codes(note)).toContain("E9_FORECAST");
      expect(codes(practice)).toContain("E9_FORECAST");
    });

    /** Scoped to three prose fields on purpose. `generatedAt`, `validatedAt`, `vettedAt` and
        `revalidatedAt` are all dates, all about the map rather than about a child, and an unscoped
        "no dates" rule would reject every map there is. */
    it("does not touch the map's own timestamps, which are dates and not forecasts", () => {
      expect(codes(cleanMap())).not.toContain("E9_FORECAST");
    });
  });

  /**
   * E10 is not one of the spec's nine. Review found it: `requires` resolves through a map keyed by
   * milestone id, and that map is last-wins, so a duplicate id silently hides one whole milestone.
   * A cycle running through the hidden one is invisible, rule 6 compares against the wrong floor,
   * and the review screen shows the wrong title beside the wrong problem.
   */
  describe("E10 milestone ids are unique", () => {
    it("catches two milestones sharing an id", () => {
      const m = withMilestones(milestone({ id: "same" }), milestone({ id: "same" }));
      expect(codes(m)).toContain("E10_DUPLICATE_ID");
    });

    it("reports one problem per duplicated id and names the id", () => {
      const m = withMilestones(
        milestone({ id: "same" }),
        milestone({ id: "same" }),
        milestone({ id: "same" }),
        milestone({ id: "other" }),
      );
      const found = validateMap(m).errors.filter((e) => e.code === "E10_DUPLICATE_ID");
      expect(found).toHaveLength(1);
      expect(found[0]?.milestoneId).toBe("same");
    });

    it("stays quiet when every id is its own", () => {
      const m = withMilestones(milestone({ id: "a" }), milestone({ id: "b" }));
      expect(codes(m)).not.toContain("E10_DUPLICATE_ID");
    });
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
