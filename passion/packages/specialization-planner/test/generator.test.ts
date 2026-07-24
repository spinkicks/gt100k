import { describe, it, expect } from "vitest";
import { stubBriefGenerator, buildStubBrief } from "../src/stub-generator.js";
import { curatedForCell } from "../src/curated.js";
import { CURATED_LIBRARY, CURATED_MUSIC_PROD_HIGH } from "../src/__fixtures__/curated.js";
import type { BriefContext, Stage } from "../src/model.js";

const STAGE_AUDIENCE: Record<Stage, BriefContext["audience"]> = {
  S1_IGNITION: "SELF",
  S2_FOUNDATIONS: "MENTOR_PEERS",
  S3_AUTHORSHIP: "REAL_COMMUNITY",
  S4_SIGNATURE: "FIELD",
};

function ctx(stage: Stage, resources: BriefContext["resources"] = []): BriefContext {
  return {
    domainPath: ["music-sound", "production"],
    mode: "build",
    stage,
    audience: STAGE_AUDIENCE[stage],
    craftFloorHint: "practice one mix technique",
    resources,
  };
}

describe("stubBriefGenerator — deterministic Type III brief (spec §3.4)", () => {
  it("returns a schema-valid brief for each stage/audience", async () => {
    for (const stage of Object.keys(STAGE_AUDIENCE) as Stage[]) {
      const brief = await stubBriefGenerator.generate(ctx(stage));
      expect(brief.title.length).toBeGreaterThan(0);
      expect(brief.drivingQuestion.length).toBeGreaterThan(0);
      expect(brief.authenticMethod.length).toBeGreaterThan(0);
      expect(brief.audience).toBe(STAGE_AUDIENCE[stage]);
      expect(brief.childOwnsChoice).toBe(true);
      expect(brief.craftScaffold.length).toBeGreaterThan(0);
      expect(brief.successLooksLike.length).toBeGreaterThan(0);
      expect(brief.source).toBe("stub");
    }
  });

  it("is deterministic — identical ctx ⇒ identical brief", async () => {
    const a = await stubBriefGenerator.generate(ctx("S3_AUTHORSHIP"));
    const b = await stubBriefGenerator.generate(ctx("S3_AUTHORSHIP"));
    expect(a).toEqual(b);
  });

  it("humanizes the domain leaf in stable title + driving-question strings (§6 golden)", () => {
    const s1 = buildStubBrief(ctx("S1_IGNITION"));
    expect(s1.title).toBe("Play with Production");
    expect(s1.drivingQuestion).toBe(
      "What about Production makes you want to come back and try more?",
    );
    const s3 = buildStubBrief(ctx("S3_AUTHORSHIP"));
    expect(s3.title).toBe("A Production project for a real community");
    expect(s3.drivingQuestion).toBe(
      "What could you make in Production that a real community would actually use or respond to?",
    );
  });

  it("CITES the passed curated resources (title + url) in the craft scaffold (SC-4 grounding)", () => {
    const resources = curatedForCell(CURATED_LIBRARY, ["music-sound", "production"], "12-14");
    expect(resources.length).toBeGreaterThan(0);
    const brief = buildStubBrief(ctx("S2_FOUNDATIONS", resources));
    expect(brief.craftScaffold).toContain(CURATED_MUSIC_PROD_HIGH.title);
    expect(brief.craftScaffold).toContain(CURATED_MUSIC_PROD_HIGH.url);
  });

  it("falls back to a generic (non-citing) scaffold when the library has no match", () => {
    const brief = buildStubBrief(ctx("S2_FOUNDATIONS", []));
    expect(brief.craftScaffold.length).toBeGreaterThan(0);
    expect(brief.craftScaffold).not.toContain("https://");
  });
});
