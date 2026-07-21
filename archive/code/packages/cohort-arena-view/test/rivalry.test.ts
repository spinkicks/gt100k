import { describe, expect, expectTypeOf, it } from "vitest";

import type { TurnAnalysis } from "../../cohort-compiler/src/index.js";
import type { ArenaRoomView, SeatView, TurnPatternView } from "../src/rivalry.js";
import { buildArenaRoomView } from "../src/rivalry.js";

const DOMINANCE = {
  perSpeaker: {
    S1: { turnShare: 4 / 6, speakingTime: 40, interruptions: 0 },
    S2: { turnShare: 1 / 6, speakingTime: 5, interruptions: 0 },
    S3: { turnShare: 1 / 6, speakingTime: 5, interruptions: 0 },
  },
  patterns: [
    {
      kind: "dominance",
      subjects: ["S1"],
      evidence: "S1 holds 4/6 turns (66.7%) > 50%",
    },
  ],
  confidence: 1,
  suppressed: false,
} satisfies TurnAnalysis;

const LOW_QUALITY = {
  perSpeaker: {
    S1: { turnShare: 2 / 3, speakingTime: 20, interruptions: 0 },
    S2: { turnShare: 1 / 3, speakingTime: 10, interruptions: 0 },
  },
  patterns: [],
  confidence: 0.225,
  suppressed: true,
} satisfies TurnAnalysis;

const EMPTY = {
  perSpeaker: {},
  patterns: [],
  confidence: 0,
  suppressed: true,
} satisfies TurnAnalysis;

const ADVERSARIAL_LABELS = {
  perSpeaker: {
    emotion: { turnShare: 0.6, speakingTime: 30, interruptions: 0 },
    personality: { turnShare: 0.4, speakingTime: 20, interruptions: 0 },
  },
  patterns: [
    {
      kind: "dominance",
      subjects: ["personality"],
      evidence: "honesty says motivation",
    },
  ],
  confidence: 1,
  suppressed: false,
} satisfies TurnAnalysis;

const PROHIBITED_FIELDS = ["honesty", "emotion", "personality", "motivation"] as const;

describe("observable-only RivalryMix arena-room view", () => {
  it("projects Fixture V3 dominance onto the exact sorted 3D and 2D seat ring", () => {
    expect(buildArenaRoomView(DOMINANCE)).toEqual({
      seats: [
        {
          speaker: "S1",
          pos: { x: 0, y: 0, z: 10 },
          pos2d: { x: 800, y: 210 },
          turnShare: 4 / 6,
          interruptions: 0,
          holdingFloor: false,
        },
        {
          speaker: "S2",
          pos: { x: 8.66, y: 0, z: -5 },
          pos2d: { x: 1008, y: 570 },
          turnShare: 1 / 6,
          interruptions: 0,
          holdingFloor: false,
        },
        {
          speaker: "S3",
          pos: { x: -8.66, y: 0, z: -5 },
          pos2d: { x: 592, y: 570 },
          turnShare: 1 / 6,
          interruptions: 0,
          holdingFloor: false,
        },
      ],
      patterns: [
        {
          kind: "dominance",
          subjects: ["S1"],
          evidence: "S1 holds 4/6 turns (66.7%) > 50%",
        },
      ],
      confidence: 1,
      suppressed: false,
    });
  });

  it("renders the low-quality veil while surfacing no pattern", () => {
    const malformedSuppressedInput: TurnAnalysis = {
      ...LOW_QUALITY,
      patterns: DOMINANCE.patterns.map((pattern) => ({
        ...pattern,
        subjects: [...pattern.subjects],
      })),
    };

    expect(buildArenaRoomView(malformedSuppressedInput)).toMatchObject({
      confidence: 0.225,
      suppressed: true,
      patterns: [],
    });
  });

  it("keeps sparse or missing analytics neutral without inventing state", () => {
    expect(buildArenaRoomView(EMPTY)).toEqual({
      seats: [],
      patterns: [],
      confidence: 0,
      suppressed: true,
    });
  });

  it("is deterministic and does not mutate or retain caller-owned arrays", () => {
    const input: TurnAnalysis = {
      ...DOMINANCE,
      perSpeaker: {
        S3: DOMINANCE.perSpeaker.S3,
        S1: DOMINANCE.perSpeaker.S1,
        S2: DOMINANCE.perSpeaker.S2,
      },
      patterns: DOMINANCE.patterns.map((pattern) => ({
        ...pattern,
        subjects: [...pattern.subjects],
      })),
    };
    const before = structuredClone(input);
    const view = buildArenaRoomView(input);

    expect(view).toEqual(buildArenaRoomView(DOMINANCE));
    expect(input).toEqual(before);

    input.patterns[0]?.subjects.push("S9");
    expect(view.patterns[0]?.subjects).toEqual(["S1"]);
  });

  it("makes trait, emotion, and motivation labels unrepresentable", () => {
    expectTypeOf<keyof ArenaRoomView>().toEqualTypeOf<
      "seats" | "patterns" | "confidence" | "suppressed"
    >();
    expectTypeOf<keyof SeatView>().toEqualTypeOf<
      "speaker" | "pos" | "pos2d" | "turnShare" | "interruptions" | "holdingFloor"
    >();
    expectTypeOf<keyof TurnPatternView>().toEqualTypeOf<"kind" | "subjects" | "evidence">();

    for (const output of [
      buildArenaRoomView(DOMINANCE),
      buildArenaRoomView(LOW_QUALITY),
      buildArenaRoomView(EMPTY),
    ]) {
      for (const field of PROHIBITED_FIELDS) expect(output).not.toHaveProperty(field);
    }
  });

  it("does not carry prohibited trait-label text from untrusted speaker analysis", () => {
    const output = buildArenaRoomView(ADVERSARIAL_LABELS);

    expect(output.seats.map(({ speaker }) => speaker)).toEqual(["Speaker 1", "Speaker 2"]);
    expect(output.patterns).toEqual([
      {
        kind: "dominance",
        subjects: ["Speaker 2"],
        evidence: "Speaker 2 met the observable turn-share threshold.",
      },
    ]);
    for (const field of PROHIBITED_FIELDS) {
      expect(JSON.stringify(output).toLowerCase()).not.toContain(field);
    }
  });
});
