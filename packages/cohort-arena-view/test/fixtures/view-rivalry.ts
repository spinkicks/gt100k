import type { TurnAnalysis } from "../../../cohort-compiler/src/index.js";
import { turnsFixtures } from "../../../cohort-compiler/test/fixtures/turns.js";
import type { ArenaRoomView } from "../../src/index.js";

const analyses = {
  dominance: turnsFixtures.dominance.expected.analysis,
  lowQuality: turnsFixtures.lowQuality.expected.analysis,
} satisfies Record<"dominance" | "lowQuality", TurnAnalysis>;

const dominance = {
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
} satisfies ArenaRoomView;

const lowQuality = {
  seats: [
    {
      speaker: "S1",
      pos: { x: 0, y: 0, z: 10 },
      pos2d: { x: 800, y: 210 },
      turnShare: 2 / 3,
      interruptions: 0,
      holdingFloor: false,
    },
    {
      speaker: "S2",
      pos: { x: 0, y: 0, z: -10 },
      pos2d: { x: 800, y: 690 },
      turnShare: 1 / 3,
      interruptions: 0,
      holdingFloor: false,
    },
  ],
  patterns: [],
  confidence: 0.225,
  suppressed: true,
} satisfies ArenaRoomView;

export const viewRivalry = {
  analyses,
  expected: { dominance, lowQuality },
};
