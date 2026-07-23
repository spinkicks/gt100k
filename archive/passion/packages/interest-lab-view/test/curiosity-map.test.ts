import { ACTIVITY_GOLDEN_V1 } from "@gt100k/interest-lab";
import { describe, expect, it } from "vitest";
import { buildCuriosityMapView } from "../src/index";

const V1_DOMAIN_ORDER = ["sound_music", "symbols_math", "visual_design"] as const;

const STUB_MANIFESTS = [
  {
    id: "music",
    domain: "sound_music",
    mapBuilding: {
      label: "Music Studio",
      glyph: "music-note",
      enterVerb: "Step inside",
      cell: { col: 0, row: 0 },
    },
  },
  {
    id: "code",
    domain: "symbols_math",
    mapBuilding: {
      label: "Code Lab",
      glyph: "code-brackets",
      enterVerb: "Step inside",
      cell: { col: 1, row: 0 },
    },
  },
  {
    id: "art",
    domain: "visual_design",
    mapBuilding: {
      label: "Art Studio",
      glyph: "art-brush",
      enterVerb: "Step inside",
      cell: { col: 2, row: 0 },
    },
  },
] as const;

describe("buildCuriosityMapView", () => {
  it("matches the exact seeded Curiosity Map golden", () => {
    expect(
      buildCuriosityMapView(STUB_MANIFESTS, ACTIVITY_GOLDEN_V1, {
        domainOrder: V1_DOMAIN_ORDER,
      }),
    ).toEqual({
      buildings: [
        {
          zoneId: "music",
          domain: "sound_music",
          label: "Music Studio",
          glyph: "music-note",
          enterVerb: "Step inside",
          cell: { col: 0, row: 0 },
          hue: "#E8825A",
          returnState: "voluntary-return",
          unfinished: 0,
          ariaLabel: "Music Studio, discovery zone, 0 unfinished, you came back here",
        },
        {
          zoneId: "code",
          domain: "symbols_math",
          label: "Code Lab",
          glyph: "code-brackets",
          enterVerb: "Step inside",
          cell: { col: 1, row: 0 },
          hue: "#5FB98C",
          returnState: "prompted-return",
          unfinished: 1,
          ariaLabel: "Code Lab, discovery zone, 1 unfinished, you came back after a reminder",
        },
        {
          zoneId: "art",
          domain: "visual_design",
          label: "Art Studio",
          glyph: "art-brush",
          enterVerb: "Step inside",
          cell: { col: 2, row: 0 },
          hue: "#6C8CE8",
          returnState: "explored",
          unfinished: 1,
          ariaLabel: "Art Studio, discovery zone, 1 unfinished, you've been here",
        },
      ],
      timeLapse: {
        phases: [
          {
            id: "first-session",
            dayOffset: 0,
            label: "Right now",
            quieted: false,
            activeCells: [
              { domain: "sound_music", workMode: "build" },
              { domain: "sound_music", workMode: "perform" },
              { domain: "symbols_math", workMode: "build" },
              { domain: "visual_design", workMode: "build" },
            ],
          },
          {
            id: "a-week-later",
            dayOffset: 7,
            label: "A week later…",
            quieted: true,
            activeCells: [
              { domain: "sound_music", workMode: "build" },
              { domain: "sound_music", workMode: "perform" },
              { domain: "sound_music", workMode: "debug" },
              { domain: "symbols_math", workMode: "build" },
            ],
          },
          {
            id: "a-month-later",
            dayOffset: 30,
            label: "A month later…",
            quieted: true,
            activeCells: [{ domain: "sound_music", workMode: "build" }],
          },
        ],
        currentPhaseId: "a-month-later",
      },
      legend: [
        { returnState: "new", note: "Not explored yet." },
        { returnState: "explored", note: "Explored once." },
        { returnState: "voluntary-return", note: "Returned without prompting." },
        { returnState: "prompted-return", note: "Returned after a prompt." },
      ],
      domainOrder: [...V1_DOMAIN_ORDER],
    });
  });

  it("rejects a manifest whose domain is absent from the catalog order", () => {
    expect(() =>
      buildCuriosityMapView(
        [
          {
            id: "unknown",
            domain: "unknown_domain",
            mapBuilding: {
              label: "Unknown Studio",
              glyph: "unknown",
              enterVerb: "Step inside",
              cell: { col: 0, row: 0 },
            },
          },
        ],
        [],
        { domainOrder: V1_DOMAIN_ORDER },
      ),
    ).toThrow("Domain is absent from catalog order: unknown_domain");
  });

  it("does not turn assistive or withdrawn actions into a map return signal", () => {
    const musicManifest = STUB_MANIFESTS.slice(0, 1);
    const activity = [
      ACTIVITY_GOLDEN_V1[0]!,
      { ...ACTIVITY_GOLDEN_V1[4]!, assistive: true },
      { ...ACTIVITY_GOLDEN_V1[8]!, withdrawn: true },
    ];

    expect(
      buildCuriosityMapView(musicManifest, activity, { domainOrder: V1_DOMAIN_ORDER }).buildings[0],
    ).toMatchObject({
      returnState: "explored",
      unfinished: 1,
      ariaLabel: "Music Studio, discovery zone, 1 unfinished, you've been here",
    });
  });
});
