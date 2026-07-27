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
  RatioMixingDiagram,
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
    rule: "Each number along a row or column is a block of filled squares, in the order written, with at least one blank square between blocks. Click once to fill a square, again to cross it out as definitely empty.",
    Diagram: NonogramDiagram,
  },
  pipes: {
    title: "Pipes",
    rule: "Every click turns a pipe one quarter-turn. Turn them until one unbroken run of pipe carries the flow from the source to every end.",
    Diagram: PipesDiagram,
  },
  mirror: {
    title: "Mirror Maze",
    rule: "Click a mirror to rotate it and guide the beam to the target. A mirror always bends the beam a quarter-turn, and the two slants bend it opposite ways — the same board as Fraction Laser, where fractions do the bending instead of slants.",
    Diagram: MirrorDiagram,
  },
  chess: {
    title: "Chess Puzzle",
    rule: "Click one of your own pieces, then click the square it should move to. The line above the board says what to find, and exactly one move does it.",
    Diagram: ChessDiagram,
  },
  "logic-grid": {
    title: "Logic Grid",
    rule: "Each clue either rules a pairing in or rules it out: click a square once for ✓ when it must be true and again for ✗ when it cannot be. Every row and every column ends with exactly one ✓.",
    Diagram: LogicGridDiagram,
  },
  lits: {
    title: "LITS",
    // The one rule that does not really fit in two sentences: four separate constraints, three of
    // them global. Recorded as a finding rather than padded into a third sentence — see the report.
    rule: "Shade four cells in every outlined region, shaped like an L, an I, a T or an S. All shaded cells must join into one group, no 2×2 square may be fully shaded, and two touching shapes may not be the same letter.",
    Diagram: LitsDiagram,
  },
  minesweeper: {
    title: "Minesweeper",
    rule: "A revealed number says how many of that square's eight neighbours hide a mine. Uncover every safe square and flag the mines instead of clicking them.",
    Diagram: MinesweeperDiagram,
  },

  // --- math ------------------------------------------------------------------------------------
  "balance-scale": {
    title: "Balance Scale",
    // Names all three move families on purpose. An earlier version said only "do the same thing to
    // both pans", which left the two moves that actually decide the puzzle — breaking a stone, and
    // splitting both pans — undescribed. Splitting is never legal on the opening board, so a child
    // told nothing about it had no reason to believe it existed.
    rule: "Both pans always weigh the same, so anything you do to one you must do to the other. Take matching stones off, break a stone into smaller ones, or split both pans evenly — until one bag stands alone.",
    Diagram: BalanceScaleDiagram,
  },
  "gear-train": {
    title: "Gear Train",
    // Says what a "crank turn" IS, because the goal is stated in them. The first version assumed the
    // unit was self-evident; playing it showed it was not — nothing on the bench told you a turn was
    // a thing you did, so the target was a number attached to nothing.
    rule: "Press the crank to turn it once, and every gear moves by its own speed — more teeth means slower. Fit three gears so the ember tooth is back on top after exactly the number of crank turns asked for, and not before.",
    Diagram: GearTrainDiagram,
  },
  "fraction-laser": {
    title: "Fraction Laser",
    rule: "Each prism sends part of the light straight on and the rest out of its side port — the two parts always make one whole. Set every prism so each crystal gets exactly the fraction written on it — the same board as Mirror Maze without fractions.",
    Diagram: FractionLaserDiagram,
  },
  "function-machine": {
    title: "Function Machine",
    rule: "Run inputs through the machine, work out what it does to them, then predict the one it refuses. A wrong prediction costs nothing and hands you that input as a clue.",
    Diagram: FunctionMachineDiagram,
  },
  "ratio-mixing": {
    title: "Ratio Mixing",
    rule: "Fill the jar to the brim so the mix holds dye and water in exactly the ratio on the order card. A poured ladle cannot be taken back, but pouring the jar out and starting again is always free.",
    Diagram: RatioMixingDiagram,
  },

  // --- music -----------------------------------------------------------------------------------
  "tune-repair": {
    title: "Tune Repair",
    // Leads with LISTEN, because there is no visual route to the answer at all — the sour note sits on
    // an ordinary row. An earlier wording described the picture first, which quietly invited a child to
    // hunt for a shape; the shape is not the puzzle and there is no shape to find.
    // Deliberately does not name the key: being told it would turn listening into lookup.
    rule: "Press play and listen: one note does not belong in this tune's key, so it sounds sour. Click the note you think it is, then nudge it up or down a step until nothing sounds wrong.",
    Diagram: TuneRepairDiagram,
  },
  "chord-fit": {
    title: "Chord Fit",
    // Says that the options are only tellable apart by ear, because the screen shows three identical
    // buttons and a child could otherwise reasonably assume they were meant to look for a difference.
    rule: "One note is sounding, and three chords could go under it. Only one of them contains that note, so play each one and pick the chord that holds the note up instead of fighting it.",
    Diagram: ChordFitDiagram,
  },
} satisfies Record<string, ActivityTeachIn>;

/** Every activity that has a teach-in. Mount sites are checked against this at compile time. */
export type TeachInId = keyof typeof TEACH_INS;

export function teachInFor(id: TeachInId): ActivityTeachIn {
  return TEACH_INS[id];
}
