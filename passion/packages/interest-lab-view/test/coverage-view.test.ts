import {
  type AudienceCondition,
  DEFAULT_LAB_CONFIG,
  type DifficultyBand,
  type Offer,
  type SocialMode,
  type WorkMode,
  buildCoverageMatrix,
} from "@gt100k/interest-lab-domain";
import { describe, expect, it } from "vitest";
import { WORK_MODE_GLYPHS, buildCoverageMatrixView, resolveDomainHue } from "../src/index";

type CoverageRow = readonly [
  id: string,
  domain: string,
  workMode: WorkMode,
  difficulty: DifficultyBand,
  social: SocialMode,
  audience: AudienceCondition,
];

const COMPLETE_ROWS = [
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
] as const satisfies readonly CoverageRow[];

const GAPPY_ROWS = [
  ["g1", "making", "build", "foundational", "solo", "no_audience"],
  ["g2", "making", "investigate", "foundational", "solo", "no_audience"],
  ["g3", "living_systems", "compose", "foundational", "solo", "no_audience"],
  ["g4", "living_systems", "explain", "foundational", "solo", "no_audience"],
  ["g5", "symbols_math", "build", "foundational", "solo", "no_audience"],
  ["g6", "word_craft", "compose", "foundational", "solo", "no_audience"],
  ["g7", "sound_music", "care", "foundational", "solo", "no_audience"],
  ["g8", "sound_music", "build", "foundational", "solo", "no_audience"],
] as const satisfies readonly CoverageRow[];

const toOffers = (rows: readonly CoverageRow[]): Offer[] =>
  rows.map(([probeId, domain, workMode, difficulty, social, audience]) => ({
    probeId,
    familyId: probeId,
    domain,
    workMode,
    difficulty,
    social,
    audience,
    provenance: "RULE",
    reason: `Coverage reason for ${probeId}.`,
    eligible: true,
  }));

const COMPLETE_CELL_IDS = [
  ["p01", null, "p03", null, null, "p02", null, null, null],
  [null, "p04", null, "p06", null, null, null, "p05", null],
  ["p08", "p07", null, null, null, "p09", null, null, null],
  [null, null, "p10", "p11", null, null, null, null, "p12"],
  ["p14", null, null, null, "p13", null, null, null, null],
  [null, null, null, null, "p15", null, "p16", null, null],
  [null, "p17", null, null, null, null, null, null, "p18"],
  [null, null, null, null, null, null, "p19", "p20", null],
].flat();

const GAPPY_CELL_IDS = [
  ["g1", "g2", null, null, null, null, null, null, null],
  [null, null, "g3", "g4", null, null, null, null, null],
  ["g5", null, null, null, null, null, null, null, null],
  [null, null, "g6", null, null, null, null, null, null],
  ["g8", null, null, null, null, null, null, "g7", null],
].flat();

const assertExactCells = (view: ReturnType<typeof buildCoverageMatrixView>, ids: unknown[]) => {
  expect(view.cells.map(({ probeId }) => probeId ?? null)).toEqual(ids);

  for (const cell of view.cells) {
    if (cell.probeId) {
      expect(cell).toEqual({
        domain: cell.domain,
        workMode: cell.workMode,
        status: "offered",
        probeId: cell.probeId,
        provenance: "RULE",
        whyCopy: `Coverage reason for ${cell.probeId}.`,
      });
    } else {
      expect(cell).toEqual({ domain: cell.domain, workMode: cell.workMode, status: "empty" });
    }
  }
};

describe("buildCoverageMatrixView", () => {
  it("matches the complete G2 rows, columns, cells, and rail", () => {
    const offers = toOffers(COMPLETE_ROWS);
    const coverage = buildCoverageMatrix(offers, DEFAULT_LAB_CONFIG);
    const view = buildCoverageMatrixView(coverage, offers);
    const domains = coverage.domains.have;

    expect(view.rows).toEqual(
      domains.map((domain) => ({ domain, hue: resolveDomainHue(domains, domain) })),
    );
    expect(view.cols).toEqual(
      coverage.workModes.have.map((workMode) => ({
        workMode,
        glyph: WORK_MODE_GLYPHS[workMode],
      })),
    );
    expect(view.rail).toEqual([
      {
        dimension: "probeCount",
        met: true,
        title: "Probe count 20/18",
        detail: "20 probes offered",
      },
      { dimension: "domains", met: true, title: "Domains 8/6", detail: domains.join(", ") },
      {
        dimension: "workModes",
        met: true,
        title: "Work modes 9/6",
        detail: coverage.workModes.have.join(", "),
      },
      { dimension: "social", met: true, title: "Social modes", detail: "solo, group" },
      {
        dimension: "difficulty",
        met: true,
        title: "Difficulty bands",
        detail: "foundational, stretch",
      },
      {
        dimension: "audience",
        met: true,
        title: "Audience conditions",
        detail: "audience, no_audience",
      },
    ]);
    expect(view.complete).toBe(true);
    expect(view.gaps).toEqual([]);
    assertExactCells(view, COMPLETE_CELL_IDS);
  });

  it("matches the gappy G3 outcomes and exact dimension-ordered gap strings", () => {
    const offers = toOffers(GAPPY_ROWS);
    const coverage = buildCoverageMatrix(offers, DEFAULT_LAB_CONFIG);
    const view = buildCoverageMatrixView(coverage, offers);
    const exactGaps = [
      "probe count 8 below minimum 18",
      "only 5 of ≥6 required domains",
      "only 5 of ≥6 required work modes",
      "no collaborative (group) probe",
      "no stretch-band probe",
      "no audience-condition probe",
    ];

    expect(view.rows.map(({ domain }) => domain)).toEqual([
      "making",
      "living_systems",
      "symbols_math",
      "word_craft",
      "sound_music",
    ]);
    expect(view.cols).toEqual(
      Object.entries(WORK_MODE_GLYPHS).map(([workMode, glyph]) => ({ workMode, glyph })),
    );
    expect(view.rail.map(({ met, gapCopy }) => ({ met, gapCopy }))).toEqual(
      exactGaps.map((gapCopy) => ({ met: false, gapCopy })),
    );
    expect(view.complete).toBe(false);
    expect(view.gaps).toEqual(exactGaps);
    assertExactCells(view, GAPPY_CELL_IDS);
  });

  it("never exposes a score or confidence key at any depth", () => {
    const offers = toOffers(GAPPY_ROWS);
    const view = buildCoverageMatrixView(buildCoverageMatrix(offers, DEFAULT_LAB_CONFIG), offers);

    expect(JSON.stringify(view)).not.toMatch(/"(?:score|confidence)":/i);
  });
});
