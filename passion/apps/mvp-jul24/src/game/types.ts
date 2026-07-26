import type { ComponentType } from "react";

/**
 * Cabin/topic ids.
 *
 * `logic-games` vs. `math` is a deliberate split, not a rename with leftovers. The seven puzzles
 * this app shipped first (Nonogram, Logic Grid, Mirror Maze, Chess, Minesweeper, Pipes, LITS) all
 * survive replacing every numeral with an arbitrary symbol, so they measure *deduction*, not
 * mathematics (docs/research/passion-pipeline/06-activity-design-ages-6-8.md §5 conflict C1). They
 * therefore live in `logic-games`, and `math` is REUSED — same id string, entirely new meaning — for
 * a genuinely mathematical cabin built in a later PR. Nothing about the old `math` semantics is
 * preserved: as of this change `math` has zero gadgets on purpose.
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
}

export interface Gadget {
  id: string;
  topic: TopicId;
  label: string;
  hotspot: GadgetHotspot;
  status: "active" | "coming-soon";
  Puzzle?: ComponentType<PuzzleProps>;
}
