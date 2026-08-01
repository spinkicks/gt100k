/**
 * Milestone attestation: how a child gets onto a rung when the work happened on somebody else's
 * server.
 *
 * The rules under test are all refusals, and each one is refusing a specific way of being wrong:
 * a link nobody examined, a link the child could not account for, and a count that quietly encodes
 * a judgment. The last is the subtle one and the reason `refusalFor` is all-or-nothing.
 */
import { describe, expect, it } from "vitest";
import type { CoverageByFacet, Facet } from "@gt100k/socratic-defense";

import {
  AUTHORSHIP_FACETS,
  evidenceFromAttestations,
  refusalFor,
  refusedAttestations,
  type Attestation,
} from "../src/attest.js";

const FULL: CoverageByFacet = {
  what: 0.9,
  why: 0.9,
  how: 0.9,
  challenge: 0.9,
  next: 0.9,
  audience: 0.9,
};

const link = (n: number) => ({
  url: `https://www.chess.com/game/live/${n}`,
  what: "A rated game I lost from a winning position",
  at: "2026-07-30T10:00:00.000Z",
});

const att = (over: Partial<Attestation> = {}): Attestation => ({
  id: "att-1",
  milestoneId: "ms-play-rated",
  links: [link(1), link(2), link(3)],
  examined: { at: "2026-07-31T10:00:00.000Z", coverageByFacet: FULL, gaps: [] },
  ...over,
});

describe("what a link alone is worth", () => {
  it("refuses an unexamined claim, because a link does not prove who played", () => {
    // The whole reason this module is not just "read the URLs". Pasting somebody else's games is
    // trivial, and the game record is genuinely public and genuinely unfakeable, which makes an
    // unexamined link look like strong evidence while proving the wrong thing.
    expect(refusalFor(att({ examined: undefined }))).toBe("not-examined");
  });

  it("treats not-examined as a queue and not a failure, by naming it separately", () => {
    // A guide seeing one word for both states cannot tell 'nobody has got to this yet' from 'this
    // child could not account for their work', and those need opposite responses.
    expect(refusalFor(att({ examined: undefined }))).not.toBe("authorship-gap");
  });

  it("refuses a claim with no links, since there is nothing to have examined", () => {
    expect(refusalFor(att({ links: [] }))).toBe("no-links");
  });

  it("refuses no-links before not-examined, because the emptier fact is the truer one", () => {
    expect(refusalFor(att({ links: [], examined: undefined }))).toBe("no-links");
  });
});

describe("which facets decide authorship", () => {
  it("stands when the defense covered everything", () => {
    expect(refusalFor(att())).toBeNull();
  });

  it.each(AUTHORSHIP_FACETS)("refuses when %s is a gap", (facet) => {
    expect(refusalFor(att({ examined: { at: "x", coverageByFacet: FULL, gaps: [facet] } }))).toBe(
      "authorship-gap",
    );
  });

  it.each(["why", "next", "audience"] as Facet[])(
    "still stands when only %s is a gap, which is not an authorship question",
    (facet) => {
      // A rated game on a server has no audience, `next` is the planner's business rather than
      // evidence of what already happened, and a child with a thin answer about why they played is
      // not thereby someone who did not play.
      expect(
        refusalFor(att({ examined: { at: "x", coverageByFacet: FULL, gaps: [facet] } })),
      ).toBeNull();
    },
  );

  it("refuses when an authorship gap is mixed in among harmless ones", () => {
    expect(
      refusalFor(
        att({ examined: { at: "x", coverageByFacet: FULL, gaps: ["audience", "how", "next"] } }),
      ),
    ).toBe("authorship-gap");
  });
});

describe("the evidence it produces", () => {
  it("counts links as artefacts, so external and studio work are in the same units", () => {
    expect(evidenceFromAttestations([att()])).toEqual([
      { milestoneId: "ms-play-rated", projectId: "att-1", artifactCount: 3 },
    ]);
  });

  it("contributes nothing at all for a refused claim, rather than contributing less", () => {
    // ALL OR NOTHING IS THE POINT. Scaling the count by how well the child answered would merge two
    // things `MilestoneEvidence` deliberately keeps apart -- how much work stands behind a rung, and
    // how good it was -- and every downstream read of `artifactCount` would silently become a
    // judgment without knowing it.
    const thin = att({ examined: { at: "x", coverageByFacet: FULL, gaps: ["how"] } });
    expect(evidenceFromAttestations([thin])).toEqual([]);
  });

  it("keeps several claims on one milestone apart", () => {
    // They must not collapse: two separate examinations are two pieces of evidence, which is the
    // only way the Shavelson caution about one artefact being underpowered can ever be answered.
    const out = evidenceFromAttestations([att(), att({ id: "att-2", links: [link(9)] })]);
    expect(out.map((e) => e.projectId)).toEqual(["att-1", "att-2"]);
    expect(out.map((e) => e.artifactCount)).toEqual([3, 1]);
  });

  it("does not shortcut the sufficiency rule that studio work is held to", () => {
    // A single attested link is still one artefact, and one artefact is not proof of a capability.
    // If this ever returned something with a count large enough to clear a threshold on its own,
    // attestation would have become a back door around `contributionOf`.
    const one = evidenceFromAttestations([att({ links: [link(1)] })]);
    expect(one[0]?.artifactCount).toBe(1);
  });
});

describe("what a guide is shown", () => {
  it("reports each refused claim with its reason", () => {
    const queued = att({ id: "att-q", examined: undefined });
    const failed = att({
      id: "att-f",
      examined: { at: "x", coverageByFacet: FULL, gaps: ["challenge"] },
    });
    expect(refusedAttestations([att(), queued, failed])).toEqual([
      { attestation: queued, reason: "not-examined" },
      { attestation: failed, reason: "authorship-gap" },
    ]);
  });

  it("says nothing about a claim that stands, which the evidence already covers", () => {
    expect(refusedAttestations([att()])).toEqual([]);
  });
});
