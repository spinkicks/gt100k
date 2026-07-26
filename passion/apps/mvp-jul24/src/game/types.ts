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
/**
 * Which cabin interior renders.
 *
 * `3d` is the one a player sees. `static` is the no-WebGL / headless-screenshot fallback. `backdrop`
 * is the still-generated-painting direction (a single AI still with perspective polygon hotspots
 * over the props painted into it — see src/cabin/backdrop/, including why the warped live-preview
 * layer that used to accompany them is switched off): opt-in only, so the two directions can be
 * compared side by side rather than argued about. See game/store.ts for how each is selected.
 */
export type CabinBackend = "3d" | "static" | "backdrop";

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
