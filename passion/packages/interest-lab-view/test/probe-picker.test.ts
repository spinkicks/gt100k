import { buildLab } from "@gt100k/interest-lab-domain";
import type {
  AudienceCondition,
  DifficultyBand,
  ProbeFamily,
  SocialMode,
  WorkMode,
} from "@gt100k/interest-lab-domain";
import { describe, expect, it } from "vitest";
import {
  WORK_MODE_GLYPHS,
  buildProbePickerView,
  resolveDomainHue,
  resolveMotion,
} from "../src/index";

type GoldenRow = readonly [
  id: string,
  domain: string,
  workMode: WorkMode,
  difficulty: DifficultyBand,
  social: SocialMode,
  audience: AudienceCondition,
];

const G1_ROWS = [
  ["p01", "making", "build", "foundational", "solo", "no_audience"],
  ["p02", "making", "debug", "stretch", "solo", "no_audience"],
  ["p03", "making", "compose", "foundational", "group", "audience"],
  ["p04", "living_systems", "investigate", "foundational", "solo", "no_audience"],
  ["p05", "living_systems", "care", "foundational", "solo", "no_audience"],
  ["p06", "living_systems", "explain", "stretch", "group", "audience"],
  ["p07", "symbols_math", "investigate", "foundational", "solo", "no_audience"],
  ["p08", "symbols_math", "build", "stretch", "solo", "no_audience"],
  ["p09", "symbols_math", "debug", "stretch", "solo", "no_audience"],
  ["p10", "word_craft", "compose", "foundational", "solo", "no_audience"],
  ["p11", "word_craft", "explain", "foundational", "group", "audience"],
  ["p12", "word_craft", "persuade", "stretch", "solo", "audience"],
  ["p13", "sound_music", "perform", "stretch", "solo", "audience"],
  ["p14", "sound_music", "build", "foundational", "group", "no_audience"],
  ["p15", "movement_body", "perform", "foundational", "group", "audience"],
  ["p16", "movement_body", "collaborate", "stretch", "solo", "no_audience"],
  ["p17", "visual_design", "investigate", "foundational", "solo", "no_audience"],
  ["p18", "visual_design", "persuade", "stretch", "solo", "audience"],
  ["p19", "social_world", "collaborate", "foundational", "group", "no_audience"],
  ["p20", "social_world", "care", "foundational", "group", "audience"],
] as const satisfies readonly GoldenRow[];

const G1_CATALOG: ProbeFamily[] = G1_ROWS.map(
  ([id, domain, workMode, difficulty, social, audience]) => ({
    familyId: id,
    variants: [
      {
        id,
        familyId: id,
        domain,
        workMode,
        prerequisites: [],
        difficulty,
        autonomy: "medium",
        social,
        audience,
        equipment: [],
        accessibilityVariants: [],
        expectedBurden: 0,
        safetyClass: "cleared",
        artifactEvidence: "synthetic G1 picker fixture",
      },
    ],
  }),
);

const makeG1Lab = () =>
  buildLab(
    "synthetic-fresh-learner",
    G1_CATALOG,
    { metPrereqs: [], engagedDomains: [] },
    { seed: 42 },
  );

const FORBIDDEN_CARD_KEYS = ["price", "score", "rank", "percentile", "verdict", "label"] as const;

describe("buildProbePickerView", () => {
  it("matches the G1 fresh-learner structural golden", () => {
    const lab = makeG1Lab();
    const view = buildProbePickerView(lab, { history: [], band: "9-11" });
    const catalogDomainsInOrder = lab.coverage.domains.have;

    expect(view.quests).toHaveLength(20);
    expect(view.quests.map(({ probeId }) => probeId)).toEqual(G1_ROWS.map(([id]) => id));
    expect(view.choicePointsMinEligible).toBeGreaterThanOrEqual(2);
    expect(view.choicePointsMinEligible).toBe(lab.choicePointsMinEligible);
    expect(view.workModeGlyphs).toEqual(WORK_MODE_GLYPHS);
    expect(view.exploration).toEqual({ domainsExplored: 0, workModesExplored: 0 });
    expect(view.visibleQuests).toEqual(view.quests.slice(0, 6));

    for (const quest of view.quests) {
      expect(quest).toMatchObject({
        provenance: "RULE",
        domainHue: resolveDomainHue(catalogDomainsInOrder, quest.domain),
        workModeGlyph: WORK_MODE_GLYPHS[quest.workMode],
        returnState: "new",
        tone: "neutral",
        motion: resolveMotion("cardEnter", { reducedMotion: false }),
        helpAffordance: true,
      });
      expect(quest.whyCopy.trim()).not.toBe("");
      expect(quest.title.trim()).not.toBe("");
      expect(FORBIDDEN_CARD_KEYS.some((key) => key in quest)).toBe(false);
    }
  });

  it("changes only copy, staging, and the visible slice across age bands", () => {
    const lab = makeG1Lab();
    const views = (["6-8", "9-11", "12-14"] as const).map((band) =>
      buildProbePickerView(lab, { history: [], band }),
    );
    const [young, middle, older] = views;

    expect(views.map(({ visibleQuests }) => visibleQuests.length)).toEqual([3, 6, 20]);
    expect(new Set(views.map(({ quests }) => quests[0]?.whyCopy)).size).toBe(3);
    expect(
      views.map(({ quests }) =>
        quests.map(({ whyCopy: _whyCopy, title: _title, ...underlying }) => underlying),
      ),
    ).toEqual([
      young?.quests.map(({ whyCopy: _whyCopy, title: _title, ...underlying }) => underlying),
      young?.quests.map(({ whyCopy: _whyCopy, title: _title, ...underlying }) => underlying),
      young?.quests.map(({ whyCopy: _whyCopy, title: _title, ...underlying }) => underlying),
    ]);
    expect(middle?.staging.band).toBe("9-11");
    expect(older?.staging.band).toBe("12-14");
  });

  it("uses the reduced card-enter equivalent when requested", () => {
    const view = buildProbePickerView(makeG1Lab(), {
      history: [],
      band: "9-11",
      flags: { reducedMotion: true },
    });

    expect(view.quests.every(({ motion }) => motion.mode === "reduced")).toBe(true);
    expect(view.quests[0]?.motion).toEqual(resolveMotion("cardEnter", { reducedMotion: true }));
  });

  it("describes guide and shadow-model provenance without presenting either as a rule", () => {
    const lab = makeG1Lab();
    const firstOffer = lab.offers[0]!;
    const copyFor = (provenance: "GUIDE" | "SHADOW_MODEL", band: "6-8" | "9-11" | "12-14") =>
      buildProbePickerView(
        {
          ...lab,
          offers: [{ ...firstOffer, provenance, reason: "Synthetic provenance reason." }],
        },
        { history: [], band },
      ).quests[0]?.whyCopy;

    expect((["6-8", "9-11", "12-14"] as const).map((band) => copyFor("GUIDE", band))).toEqual([
      "Your guide picked a new way to build.",
      "Your guide suggested this build quest as another thing to try.",
      "Guide suggestion: Synthetic provenance reason.",
    ]);
    expect(
      (["6-8", "9-11", "12-14"] as const).map((band) => copyFor("SHADOW_MODEL", band)),
    ).toEqual([
      "Here is another build quest you could try.",
      "A possible build quest was suggested for your guide to review.",
      "Model suggestion for guide review: Synthetic provenance reason.",
    ]);
  });
});
