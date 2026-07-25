// Hand-authored Pipes levels. Each `solvedRotation` is the number of clockwise
// quarter-turns from the tile's canonical shape (see logic.ts BASE_MASK) that
// reaches the solved orientation. `makeGrid` (logic.ts) shuffles from there,
// deterministically, using the puzzle seed.
import type { Level, TileSpec } from "./logic";

const blank: TileSpec = { kind: "blank", solvedRotation: 0 };

// Level 1 — 3x3 "L": source -> east -> turn south -> endpoint.
const L_TURN: Level = [
  [
    { kind: "cap", solvedRotation: 0, isSource: true },
    { kind: "straight", solvedRotation: 0 },
    { kind: "elbow", solvedRotation: 2 },
  ],
  [blank, blank, { kind: "straight", solvedRotation: 1 }],
  [blank, blank, { kind: "cap", solvedRotation: 3, isEndpoint: true }],
];

// Level 2 — 3x3 "plus": a fixed cross source feeding four cap endpoints.
const PLUS: Level = [
  [blank, { kind: "cap", solvedRotation: 1, isEndpoint: true }, blank],
  [
    { kind: "cap", solvedRotation: 0, isEndpoint: true },
    { kind: "cross", solvedRotation: 0, isSource: true },
    { kind: "cap", solvedRotation: 2, isEndpoint: true },
  ],
  [blank, { kind: "cap", solvedRotation: 3, isEndpoint: true }, blank],
];

// Level 3 — 4x4 winding snake: source -> east -> south -> west -> south -> endpoint.
const SNAKE: Level = [
  [
    { kind: "cap", solvedRotation: 0, isSource: true },
    { kind: "straight", solvedRotation: 0 },
    { kind: "elbow", solvedRotation: 2 },
    blank,
  ],
  [blank, blank, { kind: "straight", solvedRotation: 1 }, blank],
  [
    { kind: "elbow", solvedRotation: 1 },
    { kind: "straight", solvedRotation: 0 },
    { kind: "elbow", solvedRotation: 3 },
    blank,
  ],
  [{ kind: "cap", solvedRotation: 3, isEndpoint: true }, blank, blank, blank],
];

export const LEVELS: Level[] = [L_TURN, PLUS, SNAKE];
