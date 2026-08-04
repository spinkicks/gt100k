import type { ComponentType } from "react";

/**
 * Cabin/topic ids.
 *
 * `logic-games` vs. `math` is a deliberate split, not a rename with leftovers. The seven puzzles
 * this app shipped first (Nonogram, Logic Grid, Mirror Maze, Chess, Minesweeper, Pipes, LITS) all
 * survive replacing every numeral with an arbitrary symbol, so they measure *deduction*, not
 * mathematics (docs/research/passion-pipeline/06-activity-design-ages-6-8.md §5 conflict C1). They
 * therefore live in `logic-games`, and `math` is REUSED — same id string, entirely new meaning — for
 * a genuinely mathematical cabin. Nothing about the old `math` semantics is preserved: it now holds
 * five gadgets of its own (Balance Scale, Gear Train, Fraction Laser, Function Machine, Ratio
 * Mixing — see src/gadgets/registry.ts), none of which are any of the seven above.
 *
 * Three of those seven (Logic Grid, Minesweeper, LITS) were later dropped from the roster — see
 * src/gadgets/registry.ts. That is a separate, later decision about how many doors the room has, and
 * it does not touch the split reasoning above: all seven still fail the swap test the same way.
 */
export type TopicId = "logic-games" | "math" | "music" | "code" | "art" | "science" | "words";
export type Screen = "map" | "cabin" | "readout";

export interface GadgetHotspot {
  xPct: number;
  yPct: number;
  label: string;
}

export interface PuzzleProps {
  seed: number;
  /**
   * Which difficulty variant to open at, when the child asked for one. OPTIONAL on purpose: a
   * puzzle that has no tiers ignores it and still compiles, which is what keeps the harder-variant
   * control a small change rather than a nine-component migration.
   *
   * Never rendered. A visible tier number would be a quantified display of the child's own
   * engagement — the thing PRD §11 refuses and the child-facing readout was removed for.
   */
  tier?: number;
  onSolved: () => void;
  onExit: () => void;
  /**
   * One try, and whether it worked. OPTIONAL for the same reason `tier` is: a puzzle that cannot
   * tell a wrong move from a right one simply omits it.
   *
   * WHY THIS EXISTS. The wellbeing engine already decides SCAFFOLD from a success rate and already
   * refuses to fabricate a PUSH without one, but nothing ever gave it a number, so the question
   * "is this child bored or drowning" could not be answered from behaviour at all. A solve on its
   * own cannot answer it either: solving in one try and solving in twenty look identical once the
   * board is clear.
   *
   * Never rendered, like `tier`. A visible tally of a child's wrong moves is a score, and the
   * moment one exists a screen renders it.
   */
  onAttempt?: (correct: boolean) => void;
}

export interface Gadget {
  id: string;
  topic: TopicId;
  label: string;
  hotspot: GadgetHotspot;
  status: "active" | "coming-soon";
  Puzzle?: ComponentType<PuzzleProps>;
  /**
   * Declares that `Puzzle` actually reads `PuzzleProps.tier` and varies its board accordingly.
   * Gates *visibility* of the overlay's "Try a harder one" offer — never set this on a gadget whose
   * component ignores `tier`, because the button promises a harder board, and an unbacked flag
   * would make the app lie to a child.
   *
   * This exists because the failure mode is concrete, not hypothetical: `Solved` and the puzzle
   * occupy the same JSX slot in `GadgetOverlay`, so clicking "harder" unmounts and remounts the
   * puzzle. A component that owns its own round/difficulty state (most of them do, independently of
   * `tier`) resets that state to its own default on remount — which is its *easy* variant. Without
   * this flag, "harder" would silently hand several gadgets back an easier board than the one just
   * solved. Optional and defaults to falsy, so every existing gadget is unaffected until someone
   * deliberately wires `tier` through and flips it on.
   */
  supportsTier?: boolean;
}
