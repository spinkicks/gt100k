import type { TurnAnalysis, TurnEvent } from "../../src/model";

export interface RivalryMixThresholdsFixture {
  dominanceTurnShare: number;
  interruptionThreshold: number;
  confidenceFloor: number;
  minTurns: number;
  qualityFloor: number;
}

interface TurnFixtureExpected {
  analysis: TurnAnalysis;
  meanQuality?: number;
  coverage?: number;
}

interface TurnFixture {
  turns: TurnEvent[];
  expected: TurnFixtureExpected;
}

export const rivalryMixThresholds = {
  dominanceTurnShare: 0.5,
  interruptionThreshold: 3,
  confidenceFloor: 0.5,
  minTurns: 4,
  qualityFloor: 0.5,
} satisfies RivalryMixThresholdsFixture;

export const turnsFixtures = {
  dominance: {
    turns: [
      { speaker: "S1", start: 0, duration: 10, overlap: false },
      { speaker: "S2", start: 10, duration: 5, overlap: false },
      { speaker: "S1", start: 15, duration: 10, overlap: false },
      { speaker: "S1", start: 25, duration: 10, overlap: false },
      { speaker: "S3", start: 35, duration: 5, overlap: false },
      { speaker: "S1", start: 40, duration: 10, overlap: false },
    ],
    expected: {
      meanQuality: 1,
      coverage: 1,
      analysis: {
        perSpeaker: {
          S1: { turnShare: 4 / 6, speakingTime: 40, interruptions: 0 },
          S2: { turnShare: 1 / 6, speakingTime: 5, interruptions: 0 },
          S3: { turnShare: 1 / 6, speakingTime: 5, interruptions: 0 },
        },
        confidence: 1,
        suppressed: false,
        patterns: [
          {
            kind: "dominance",
            subjects: ["S1"],
            evidence: "S1 holds 4/6 turns (66.7%) > 50%",
          },
        ],
      },
    },
  },
  interruption: {
    turns: [
      { speaker: "S1", start: 0, duration: 10, overlap: false },
      { speaker: "S2", start: 8, duration: 6, overlap: true },
      { speaker: "S1", start: 14, duration: 10, overlap: false },
      { speaker: "S2", start: 20, duration: 5, overlap: true },
      { speaker: "S3", start: 25, duration: 8, overlap: false },
      { speaker: "S2", start: 30, duration: 5, overlap: true },
      { speaker: "S1", start: 35, duration: 8, overlap: false },
      { speaker: "S3", start: 43, duration: 7, overlap: false },
    ],
    expected: {
      meanQuality: 1,
      coverage: 1,
      analysis: {
        perSpeaker: {
          S1: { turnShare: 3 / 8, speakingTime: 28, interruptions: 0 },
          S2: { turnShare: 3 / 8, speakingTime: 16, interruptions: 3 },
          S3: { turnShare: 2 / 8, speakingTime: 15, interruptions: 0 },
        },
        confidence: 1,
        suppressed: false,
        patterns: [
          {
            kind: "repeated_interruption",
            subjects: ["S2"],
            evidence: "S2 initiated 3 overlapping turns ≥ 3",
          },
        ],
      },
    },
  },
  lowQuality: {
    turns: [
      { speaker: "S1", start: 0, duration: 10, overlap: false, quality: 0.3 },
      { speaker: "S2", start: 10, duration: 10, overlap: false, quality: 0.3 },
      { speaker: "S1", start: 20, duration: 10, overlap: false, quality: 0.3 },
    ],
    expected: {
      meanQuality: 0.3,
      coverage: 0.75,
      analysis: {
        perSpeaker: {
          S1: { turnShare: 2 / 3, speakingTime: 20, interruptions: 0 },
          S2: { turnShare: 1 / 3, speakingTime: 10, interruptions: 0 },
        },
        confidence: 0.225,
        suppressed: true,
        patterns: [],
      },
    },
  },
  sparse: {
    turns: [{ speaker: "S1", start: 0, duration: 10, overlap: false }],
    expected: {
      meanQuality: 1,
      coverage: 0.25,
      analysis: {
        perSpeaker: {
          S1: { turnShare: 1, speakingTime: 10, interruptions: 0 },
        },
        confidence: 0.25,
        suppressed: true,
        patterns: [],
      },
    },
  },
  empty: {
    turns: [],
    expected: {
      meanQuality: 0,
      coverage: 0,
      analysis: {
        perSpeaker: {},
        confidence: 0,
        suppressed: true,
        patterns: [],
      },
    },
  },
  ambiguous: {
    turns: [
      { speaker: "S1", start: 0, duration: 10, overlap: false },
      { speaker: "S2", start: 8, duration: 5, overlap: true, quality: 0.2 },
      { speaker: "S1", start: 13, duration: 10, overlap: false },
      { speaker: "S2", start: 20, duration: 5, overlap: true },
      { speaker: "S1", start: 27, duration: 10, overlap: false },
      { speaker: "S2", start: 33, duration: 5, overlap: true },
    ],
    expected: {
      meanQuality: 5.2 / 6,
      coverage: 1,
      analysis: {
        perSpeaker: {
          S1: { turnShare: 0.5, speakingTime: 30, interruptions: 0 },
          S2: { turnShare: 0.5, speakingTime: 15, interruptions: 2 },
        },
        confidence: 5.2 / 6,
        suppressed: false,
        patterns: [],
      },
    },
  },
} satisfies Record<string, TurnFixture>;
