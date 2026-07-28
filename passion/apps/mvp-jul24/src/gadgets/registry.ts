import type { Gadget, TopicId } from "../game/types";
import BalanceScale from "../puzzles/BalanceScale/BalanceScale";
import Chess from "../puzzles/Chess/Chess";
import ChordFit from "../puzzles/ChordFit/ChordFit";
import Downbeat from "../puzzles/Downbeat/Downbeat";
import FractionLaser from "../puzzles/FractionLaser/FractionLaser";
import FunctionMachine from "../puzzles/FunctionMachine/FunctionMachine";
import GearTrain from "../puzzles/GearTrain/GearTrain";
import Mirror from "../puzzles/Mirror/Mirror";
import Nonogram from "../puzzles/Nonogram/Nonogram";
import Pipes from "../puzzles/Pipes/Pipes";
import RatioMixing from "../puzzles/RatioMixing/RatioMixing";
import TuneRepair from "../puzzles/TuneRepair/TuneRepair";

/**
 * Every gadget in the game, keyed to the cabin (topic) it lives in.
 *
 * The four in `logic-games` each survive replacing every numeral with an arbitrary symbol, so what
 * they exercise is deduction rather than mathematics (see the TopicId doc comment in
 * src/game/types.ts). The five in `math` do not: swap their content for symbols and there is nothing
 * left to reason about, which is the swap test (research memo §2.1/D1) and the reason the split
 * exists at all.
 *
 * Consumers of `gadgetsForTopic` must still tolerate an empty list: `music`/`code`/`art` return one.
 * `cabin/backdrop/CabinBackdrop.tsx` renders a normal empty room for them.
 *
 * The `math` entries are fully authored: `cabin/backdrop/quads.data.ts` has a `MATH` room whose prop
 * quads cover all five, traced onto `public/art/cabin-backdrop-math.png` (#179). PROJECT.md's
 * prop-to-activity map records which painted object is which.
 *
 * ===========================================================================================
 * LOGIC GAMES IS FOUR, NOT SEVEN — DECIDED 2026-07-25. THIS IS THE ONLY PLACE THAT DECIDES IT.
 * ===========================================================================================
 *
 * **Logic Grid**, **LITS** and **Minesweeper** used to be here and are not any more. Nothing about
 * them was deleted: `src/puzzles/LogicGrid/`, `src/puzzles/LITS/` and `src/puzzles/Minesweeper/`
 * are all still in the tree, still compiled, still covered by their own passing test suites, and
 * their wall previews are still registered and tested in `cabin/backdrop/previews/`. They are
 * simply not listed as activities, so nothing routes a player to them.
 *
 * WHY (four reasons, in the order they carry weight)
 *
 * 1. The cabin's backdrop art gives us **four** surfaces that can hold a puzzle without wrecking
 *    the room's composition. An attempt to manufacture six produced a wall of identical blank
 *    frames that had to be thrown away — the room, not the roster, is the binding constraint. Two
 *    of the seven props in `cabin/backdrop/quads.data.ts` were already flagged PARKED on borrowed
 *    surfaces (a chimney breast, a bookshelf gap) for exactly this reason.
 * 2. **LITS** is the least legible of the seven to someone watching over a shoulder — and a
 *    passion-finder is judged partly on whether a puzzle looks worth walking over to.
 * 3. **Logic Grid** is reading comprehension as much as deduction, so it loads on a second
 *    construct. That is a measurement problem, not a taste one: time spent on it is not cleanly
 *    attributable to the thing this cabin is supposed to be measuring.
 * 4. **Minesweeper** duplicates Nonogram's construct (mark cells from numeric edge constraints)
 *    while adding a luck element and a lose-state no other puzzle here has. It buys the least new
 *    information per door in the room.
 *
 * Four also **density-matches** the five maths games planned for the `math` cabin far better than
 * seven did. That does not make cross-cabin comparison valid — PROJECT.md's Risks section is clear
 * that it is not, for reasons beyond activity count — but 4-vs-5 stops the raw door count from
 * being the loudest difference between the two rooms.
 *
 * TO RE-ADD ONE (all of this is deliberately trivial; keep it that way)
 *   1. re-import its component at the top of this file;
 *   2. re-add its entry to `GADGETS` below — the `hotspot` percentages for all three are still in
 *      `cabin/hotspots.ts` (`STATIC_POSITIONS`) and their 3D placements are still in
 *      `cabin/scene3d/anchors.ts` (`KNOWN_PROPS`), both left in place on purpose;
 *   3. author a prop quad for it in `cabin/backdrop/quads.data.ts` — this is the only step with
 *      real work in it, because `quads.data.test.ts` requires the backdrop room to cover every
 *      gadget in the topic exactly once, and the surface has to actually exist in the painting.
 * Step 3 is the reason this is a decision and not a toggle: the art is the constraint.
 */
export const GADGETS: Gadget[] = [
  {
    id: "nonogram",
    topic: "logic-games",
    label: "Nonogram",
    status: "active",
    Puzzle: Nonogram,
    hotspot: { xPct: 15, yPct: 60, label: "Nonogram" },
    // Nonogram is the one gadget whose component reads `PuzzleProps.tier` (see Nonogram.tsx and
    // the doc comment on `Gadget.supportsTier`) — the other eight ignore it and must not set this.
    supportsTier: true,
  },
  {
    id: "mirror",
    topic: "logic-games",
    label: "Mirror Maze",
    status: "active",
    Puzzle: Mirror,
    hotspot: { xPct: 55, yPct: 60, label: "Mirror Maze" },
  },
  {
    id: "chess",
    topic: "logic-games",
    label: "Chess Puzzle",
    status: "active",
    Puzzle: Chess,
    hotspot: { xPct: 75, yPct: 60, label: "Chess Puzzle" },
  },
  {
    id: "pipes",
    topic: "logic-games",
    label: "Pipes",
    status: "active",
    Puzzle: Pipes,
    hotspot: { xPct: 50, yPct: 85, label: "Pipes" },
  },

  // --- math: the maths IS the mechanic in each of these, never a quiz attached to one. ---
  {
    id: "balance-scale",
    topic: "math",
    label: "Balance Scale",
    status: "active",
    Puzzle: BalanceScale,
    hotspot: { xPct: 20, yPct: 55, label: "Balance Scale" },
  },
  {
    id: "gear-train",
    topic: "math",
    label: "Gear Train",
    status: "active",
    Puzzle: GearTrain,
    hotspot: { xPct: 40, yPct: 55, label: "Gear Train" },
  },
  {
    id: "fraction-laser",
    topic: "math",
    label: "Fraction Laser",
    status: "active",
    Puzzle: FractionLaser,
    hotspot: { xPct: 60, yPct: 55, label: "Fraction Laser" },
  },
  {
    id: "function-machine",
    topic: "math",
    label: "Function Machine",
    status: "active",
    Puzzle: FunctionMachine,
    hotspot: { xPct: 80, yPct: 55, label: "Function Machine" },
  },
  {
    id: "ratio-mixing",
    topic: "math",
    label: "Ratio Mixing",
    status: "active",
    Puzzle: RatioMixing,
    hotspot: { xPct: 50, yPct: 82, label: "Ratio Mixing" },
  },

  // --- music: the MUSIC is the mechanic, and in all three it is a question the eye is not given.
  // Each is audible-only by construction (PROJECT.md R2), which is also their known accessibility
  // cost — see the risk list there, because no gadget in this room's designed roster fixes it.
  //
  // `supportsTier` is set on all three because each reads `PuzzleProps.tier` to open at a difficulty.
  // That flag is only honest because each routes it through `puzzles/openTier.ts` first: their
  // generators resolve a round with `index % TIERS.length`, and handed the overlay's unbounded press
  // counter that wraps to the EASIEST board on the third press of "Try a harder one". Do not set this
  // on a fourth music gadget without doing the same.
  //
  // Order within the topic is the order props are placed and the `position` recorded on each
  // `SurfacedRecord`, so it is left-to-right as painted: lute, organ, drum.
  {
    id: "tune-repair",
    topic: "music",
    label: "Tune Repair",
    status: "active",
    Puzzle: TuneRepair,
    hotspot: { xPct: 17, yPct: 39, label: "Tune Repair" },
    supportsTier: true,
  },
  {
    id: "chord-fit",
    topic: "music",
    label: "Chord Fit",
    status: "active",
    Puzzle: ChordFit,
    hotspot: { xPct: 47, yPct: 46, label: "Chord Fit" },
    supportsTier: true,
  },
  {
    id: "downbeat",
    topic: "music",
    label: "Downbeat",
    status: "active",
    Puzzle: Downbeat,
    hotspot: { xPct: 68, yPct: 69, label: "Downbeat" },
    supportsTier: true,
  },
];

export function gadgetsForTopic(topic: TopicId): Gadget[] {
  return GADGETS.filter((g) => g.topic === topic);
}

export function gadgetById(id: string): Gadget | undefined {
  return GADGETS.find((g) => g.id === id);
}
