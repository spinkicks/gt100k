import { GADGETS, gadgetById, gadgetsForTopic } from "./registry";

/** The roster, in full. Four, not the original seven — see the block comment in registry.ts. */
const LOGIC_GAMES_IDS = ["nonogram", "mirror", "chess", "pipes"];

/**
 * Dropped from the roster on 2026-07-25, NOT deleted from the app. Each still has its component,
 * logic, generator/bank, data and test suite in `src/puzzles/`, all passing. This list is the
 * assertion that the trim was a registry change and nothing more.
 */
const TRIMMED_IDS = ["logic-grid", "minesweeper", "lits"];

test('gadgetsForTopic("logic-games") returns exactly the four roster gadgets', () => {
  const gadgets = gadgetsForTopic("logic-games");
  expect(gadgets.map((g) => g.id)).toEqual(LOGIC_GAMES_IDS);
  expect(gadgets.every((g) => g.topic === "logic-games")).toBe(true);
});

test("every logic-games gadget is active with a Puzzle component", () => {
  const gadgets = gadgetsForTopic("logic-games");
  expect(gadgets).toHaveLength(LOGIC_GAMES_IDS.length);
  for (const gadget of gadgets) {
    expect(gadget.status, gadget.id).toBe("active");
    expect(gadget.Puzzle, gadget.id).toBeDefined();
  }
});

// Guards the trim in the direction it can silently reverse: someone re-adds an entry without
// authoring the backdrop prop it needs, and quads.data.test.ts starts failing a file away from the
// change that caused it. Re-adding one deliberately means editing this list too (see registry.ts,
// "TO RE-ADD ONE").
test("the trimmed puzzles are absent from every topic, in the registry only", () => {
  for (const id of TRIMMED_IDS) {
    expect(gadgetById(id), id).toBeUndefined();
  }
});

// The seven puzzles moved out of `math` because none of them is actually mathematical (see the
// TopicId doc comment in src/game/types.ts). `math` is now reserved for a real maths cabin that
// `math` now holds the five maths activities. The property worth protecting is no longer that it is
// empty, but that it never picks up a deduction puzzle: the whole point of the split is that these
// two rooms measure different things, and the failure mode is someone re-pointing a `logic-games`
// puzzle at `math` because it "feels mathematical".
test('gadgetsForTopic("math") holds only the maths activities', () => {
  const ids = gadgetsForTopic("math").map((g) => g.id);
  expect(ids).toEqual([
    "balance-scale",
    "gear-train",
    "fraction-laser",
    "function-machine",
    "ratio-mixing",
  ]);
  for (const deduction of [
    "nonogram",
    "mirror",
    "chess",
    "pipes",
    "logic-grid",
    "lits",
    "minesweeper",
  ]) {
    expect(ids).not.toContain(deduction);
  }
});

test("music holds its three activities", () => {
  expect(gadgetsForTopic("music").map((g) => g.id)).toEqual([
    "tune-repair",
    "chord-fit",
    "downbeat",
  ]);
});

test("the still-unbuilt cabins return an empty list", () => {
  // `music` left this list on 2026-07-27. `echo` is designed but not built, and deliberately not
  // registered: quads.data.test.ts matches props to gadgets exactly both ways, so registering a
  // fourth would demand a repainted room.
  for (const topic of ["code", "art"] as const) {
    expect(gadgetsForTopic(topic)).toEqual([]);
  }
});

test("gadgetById returns the matching gadget or undefined", () => {
  expect(gadgetById("nonogram")?.id).toBe("nonogram");
  expect(gadgetById("nope")).toBeUndefined();
});

// Pins the invariant the doc comment on `Gadget.supportsTier` (src/game/types.ts) describes but
// nothing previously enforced: only a gadget whose component actually reads `PuzzleProps.tier` may
// set this flag, because `GadgetOverlay` uses it to decide whether to show the "harder" offer at
// all, and an unbacked flag would promise a harder board the puzzle can't deliver. Nonogram is the
// only one wired up today.
test("supportsTier is set on exactly the gadgets whose component honours it", () => {
  // Nonogram reads `tier` for its board size; all three music activities read it to open at a
  // difficulty, which is what keeps "give me an easier one" a one-number change rather than a mode.
  const withSupportsTier = GADGETS.filter((g) => g.supportsTier).map((g) => g.id);
  expect(withSupportsTier).toEqual(["nonogram", "tune-repair", "chord-fit", "downbeat"]);
});
