/**
 * What each activity's teach-in says. Data only — TeachIn.tsx owns every behaviour.
 *
 * ADDING ACTIVITY THIRTEEN IS AN ENTRY IN THIS OBJECT. That is the whole design: a puzzle supplies
 * its rule as text and its picture as a component, and gets the opening-and-dismissing, the `?`, the
 * Escape handling and the styling for free. `TeachInId` is derived from the keys below, so
 * `<TeachIn activity="…" />` at a mount site that has no rule here is a *typecheck* failure, not a
 * silently blank panel; `rules.test.tsx` closes the loop from the other side by walking the gadget
 * registry.
 *
 * WHY THE WORDS ARE MOSTLY NOT NEW. Six of the twelve already display a one-sentence rule in-component
 * (GearTrain's `.gt-rule`, BalanceScale's `.bs-rule`, FractionLaser's `.fl-hint`, FunctionMachine's
 * `.fm-status`, Mirror's `.mr-hint`, LITS's shade-cells hint). Those sentences were written for those
 * puzzles and tested there; re-wording them here would mean a child reads one phrasing in the panel
 * and a different one on the board. So they are reused close to verbatim, with only the edits a
 * static panel forces — GearTrain's rule interpolates the level's target turn count, which a data
 * table cannot know, so it says "the number of crank turns asked for" instead.
 *
 * The other six (Nonogram, Pipes, Chess, Logic Grid, Minesweeper, Ratio Mixing) render no rule line
 * at all, so their sentences are written here for the first time — from what their `logic.ts` win
 * condition actually checks, not from a general idea of the genre.
 *
 * TWO SENTENCES, HARD CEILING. PROJECT.md budgets ~20 seconds. `rules.test.tsx` enforces at most two
 * sentences and at most 45 words, which is roughly 20 seconds of reading at this age. If a rule will
 * not fit, that is a finding about the puzzle and belongs in a review, not in a third sentence.
 */
import type { ComponentType } from "react";
import {
  BalanceScaleDiagram,
  ChessDiagram,
  FractionLaserDiagram,
  FunctionMachineDiagram,
  GearTrainDiagram,
  LitsDiagram,
  LogicGridDiagram,
  MinesweeperDiagram,
  MirrorDiagram,
  NonogramDiagram,
  PipesDiagram,
  ChordFitDiagram,
  DownbeatDiagram,
  RatioMixingDiagram,
  SpriteLoopDiagram,
  TeachHelperDiagram,
  TraceRepairDiagram,
  TuneRepairDiagram,
} from "./diagrams";

export interface ActivityTeachIn {
  /** The activity's name, used for the panel's accessible name. */
  title: string;
  /**
   * The rule, stated plainly. One or two sentences — direct instruction, never a hint that invites
   * the child to work the rule out (Chen & Klahr 1999: probes without instruction taught 7–10s
   * nothing). Must avoid D7's banned vocabulary, because this text renders inside the host puzzle
   * and several of them assert against it.
   */
  rule: string;
  /** A labelled picture of that same rule. */
  Diagram: ComponentType;
}

/**
 * Keyed by gadget id from src/gadgets/registry.ts.
 *
 * Seven of these ids are `logic-games` and five are `math`, but the split does not appear here —
 * a teach-in has no reason to know which room it is in. `logic-grid`, `lits` and `minesweeper` left
 * the roster on 2026-07-25 and are still in the tree, so they have entries too: re-adding one stays
 * the one-line registry change the registry comment promises, rather than one line plus a rule.
 */
export const TEACH_INS = {
  // --- logic-games -----------------------------------------------------------------------------
  nonogram: {
    title: "Nonogram",
    rule: "Numbers tell you how many squares to fill, in that order. Leave a gap between blocks. Click to fill, click again to cross out.",
    Diagram: NonogramDiagram,
  },
  pipes: {
    title: "Pipes",
    rule: "Click a pipe to turn it. Keep turning until the water can reach every end.",
    Diagram: PipesDiagram,
  },
  mirror: {
    title: "Mirror Maze",
    rule: "Click a mirror to turn it. Each mirror bends the beam a quarter turn. Send the beam to the target.",
    Diagram: MirrorDiagram,
  },
  chess: {
    title: "Chess Puzzle",
    rule: "Click your piece, then click where it should go. The line above says what to look for. Only one move works.",
    Diagram: ChessDiagram,
  },
  "logic-grid": {
    title: "Logic Grid",
    rule: "Each clue tells you a pair is true or false. Click once for yes, twice for no. Every row and column gets one yes.",
    Diagram: LogicGridDiagram,
  },
  lits: {
    title: "LITS",
    // The one rule that does not really fit in two sentences: four separate constraints, three of
    // them global. Recorded as a finding rather than padded into a third sentence — see the report.
    rule: "Shade four cells in each region, shaped like L, I, T or S. All shaded cells must touch. No solid 2 by 2 block. Touching shapes must differ.",
    Diagram: LitsDiagram,
  },
  minesweeper: {
    title: "Minesweeper",
    rule: "A number counts the mines touching that square. Uncover the safe squares. Flag the mines instead of clicking them.",
    Diagram: MinesweeperDiagram,
  },

  // --- math ------------------------------------------------------------------------------------
  "balance-scale": {
    title: "Balance Scale",
    // Names all three move families on purpose. An earlier version said only "do the same thing to
    // both pans", which left the two moves that actually decide the puzzle — breaking a stone, and
    // splitting both pans — undescribed. Splitting is never legal on the opening board, so a child
    // told nothing about it had no reason to believe it existed.
    rule: "The two pans always weigh the same. Do the same thing to both. Keep going until one bag is left alone.",
    Diagram: BalanceScaleDiagram,
  },
  "gear-train": {
    title: "Gear Train",
    // Says what a "crank turn" IS, because the goal is stated in them. The first version assumed the
    // unit was self-evident; playing it showed it was not — nothing on the bench told you a turn was
    // a thing you did, so the target was a number attached to nothing.
    rule: "Turn the crank and every gear moves. More teeth means slower. Pick three gears so the marked tooth comes back on top at the right turn.",
    Diagram: GearTrainDiagram,
  },
  "fraction-laser": {
    title: "Fraction Laser",
    rule: "Each glass splits the light into two parts. The two parts always add up to one. Set them so every crystal gets the share written on it.",
    Diagram: FractionLaserDiagram,
  },
  "function-machine": {
    title: "Function Machine",
    rule: "Feed numbers in and watch what comes out. Work out the rule. Then guess the one number it will not take.",
    Diagram: FunctionMachineDiagram,
  },
  "ratio-mixing": {
    title: "Ratio Mixing",
    rule: "Fill the jar with dye and water in the amounts on the card. You cannot take a ladle back. Emptying the jar and starting over is free.",
    Diagram: RatioMixingDiagram,
  },

  // --- music -----------------------------------------------------------------------------------
  "tune-repair": {
    title: "Tune Repair",
    // Leads with LISTEN, because there is no visual route to the answer at all — the sour note sits on
    // an ordinary row. An earlier wording described the picture first, which quietly invited a child to
    // hunt for a shape; the shape is not the puzzle and there is no shape to find.
    // Deliberately does not name the key: being told it would turn listening into lookup.
    rule: "Listen. One note sounds wrong. Click it, then move it up or down until the tune sounds right.",
    Diagram: TuneRepairDiagram,
  },
  "chord-fit": {
    title: "Chord Fit",
    // Says that the options are only tellable apart by ear, because the screen shows three identical
    // buttons and a child could otherwise reasonably assume they were meant to look for a difference.
    rule: "One note is playing. Three chords could go under it. Try each one and pick the chord that fits.",
    Diagram: ChordFitDiagram,
  },
  downbeat: {
    title: "Downbeat",
    // Names LOUDER explicitly, because every pulse looks identical and a child could otherwise spend the
    // whole activity hunting the strip for a difference that is deliberately not drawn.
    rule: "Every beat looks the same, but some sound louder. A louder beat starts a new bar. Play it, then mark the loud ones.",
    Diagram: DownbeatDiagram,
  },

  // --- code ------------------------------------------------------------------------------------
  "sprite-loop": {
    title: "Sprite Loop",
    // Two sentences, and the second one carries the load: **at the same speed**. The board draws no
    // path behind the creature, so a child could otherwise reasonably read the job as matching a
    // shape — which is the one reading rule X2 exists to prevent. "Blocks" names the tray so it reads
    // as the place to begin without the copy having to gesture at it.
    rule: "One creature moves in a pattern, again and again. Use blocks to make yours move the same way.",
    Diagram: SpriteLoopDiagram,
  },
  "trace-repair": {
    title: "Trace & Repair",
    // Says STEP THROUGH IT, because the round is built so the ending cannot tell you which line is at
    // fault -- several lines could explain where the creature stops, and only the middle of the run
    // separates them. A child who reads only the final board will blame the wrong line, so the one
    // instruction worth spending a sentence on is the scrubber.
    rule: "One line of this program is wrong. Drag the slider to step through both creatures. Find where they split, then fix that line.",
    Diagram: TraceRepairDiagram,
  },
  "teach-helper": {
    title: "Teach the Helper",
    // Says OTHER FLOORS YOU WILL NOT SEE, and stops there. Naming the trap outright -- "so take
    // everywhere" -- would replace the insight with an instruction, and the insight is the thing this
    // door detects. A child has to be told the rules of the game; they must not be told the answer.
    rule: "Write steps for the helper. It will try them on floors you cannot see, where the parcels sit elsewhere. Say take when it is standing on one.",
    Diagram: TeachHelperDiagram,
  },
} satisfies Record<string, ActivityTeachIn>;

/** Every activity that has a teach-in. Mount sites are checked against this at compile time. */
export type TeachInId = keyof typeof TEACH_INS;

export function teachInFor(id: TeachInId): ActivityTeachIn {
  return TEACH_INS[id];
}
