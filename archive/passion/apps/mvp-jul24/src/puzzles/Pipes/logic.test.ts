import { LEVELS } from "./levels.data";
import {
  DIR,
  type Grid,
  type Level,
  computePowered,
  isSolved,
  makeGrid,
  maskAt,
  rotateMaskCW,
  rotateTile,
} from "./logic";

test("rotateMaskCW cycles a single opening N -> E -> S -> W -> N", () => {
  let m: number = DIR.N;
  m = rotateMaskCW(m);
  expect(m).toBe(DIR.E);
  m = rotateMaskCW(m);
  expect(m).toBe(DIR.S);
  m = rotateMaskCW(m);
  expect(m).toBe(DIR.W);
  m = rotateMaskCW(m);
  expect(m).toBe(DIR.N);
});

test("rotateMaskCW cycles a multi-opening tile (elbow) through all 4 orientations", () => {
  const base = DIR.N | DIR.E;
  expect(maskAt("elbow", 0)).toBe(base);
  expect(maskAt("elbow", 1)).toBe(DIR.E | DIR.S);
  expect(maskAt("elbow", 2)).toBe(DIR.S | DIR.W);
  expect(maskAt("elbow", 3)).toBe(DIR.W | DIR.N);
  expect(maskAt("elbow", 4)).toBe(base); // full circle
});

test("rotateTile increments rotation mod 4 and leaves blanks inert", () => {
  const grid: Grid = [
    [
      { kind: "cap", solvedRotation: 0, rotation: 0, isSource: true },
      { kind: "blank", solvedRotation: 0, rotation: 0 },
    ],
  ];
  let g = rotateTile(grid, 0, 0);
  expect(g[0]![0]!.rotation).toBe(1);
  g = rotateTile(rotateTile(rotateTile(g, 0, 0), 0, 0), 0, 0);
  expect(g[0]![0]!.rotation).toBe(0); // 4 clicks -> back to start
  g = rotateTile(g, 0, 1);
  expect(g[0]![1]!.rotation).toBe(0); // blank never rotates
});

// A tiny hand-solved 1x3 line: source(E) -- straight(EW) -- endpoint(W).
function solvedLine(): Grid {
  return [
    [
      { kind: "cap", solvedRotation: 0, rotation: 0, isSource: true },
      { kind: "straight", solvedRotation: 0, rotation: 0 },
      { kind: "cap", solvedRotation: 2, rotation: 2, isEndpoint: true },
    ],
  ];
}

test("isConnected: a known solved layout reports connected", () => {
  const grid = solvedLine();
  const powered = computePowered(grid);
  expect(powered.has("0,0")).toBe(true);
  expect(powered.has("0,1")).toBe(true);
  expect(powered.has("0,2")).toBe(true);
  expect(isSolved(grid)).toBe(true);
});

test("isConnected: an unsolved layout (endpoint cap facing away) reports not connected", () => {
  const grid = solvedLine();
  // Rotate the endpoint cap so its opening no longer faces the incoming pipe.
  grid[0]![2] = { ...grid[0]![2]!, rotation: 0 };
  expect(computePowered(grid).has("0,2")).toBe(false);
  expect(isSolved(grid)).toBe(false);
});

test("isSolved is false with no endpoints reached and requires at least one endpoint", () => {
  const grid: Grid = [[{ kind: "cap", solvedRotation: 0, rotation: 0, isSource: true }]];
  expect(isSolved(grid)).toBe(false);
});

test.each(LEVELS.map((level, i) => [i, level] as const))(
  "level %i is solvable when every tile sits at its solvedRotation",
  (_i, level: Level) => {
    const solved: Grid = level.map((row) =>
      row.map((spec) => ({ ...spec, rotation: spec.solvedRotation })),
    );
    expect(isSolved(solved)).toBe(true);
  },
);

test("makeGrid is deterministic for a given seed and shuffles tiles off-solution", () => {
  const level = LEVELS[0]!;
  const a = makeGrid(level, 42);
  const b = makeGrid(level, 42);
  expect(a).toEqual(b);
  // Different seed can (and for seed 42 vs 7 here, does) produce a different shuffle.
  const c = makeGrid(level, 7);
  expect(c).not.toEqual(a);
});

test("makeGrid never starts a level already solved", () => {
  for (const level of LEVELS) {
    for (let seed = 0; seed < 20; seed++) {
      const grid = makeGrid(level, seed);
      expect(isSolved(grid)).toBe(false);
    }
  }
});
