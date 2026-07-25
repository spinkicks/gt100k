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
 */
export type TopicId = "logic-games" | "math" | "music" | "code" | "art" | "science" | "words";
export type Screen = "map" | "cabin" | "readout";
export type CabinBackend = "3d" | "static";

export interface GadgetHotspot {
  xPct: number;
  yPct: number;
  label: string;
}

export interface PuzzleProps {
  seed: number;
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
