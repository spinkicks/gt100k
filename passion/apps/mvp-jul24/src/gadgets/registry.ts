import type { Gadget, TopicId } from "../game/types";
import Chess from "../puzzles/Chess/Chess";
import LITS from "../puzzles/LITS/LITS";
import LogicGrid from "../puzzles/LogicGrid/LogicGrid";
import Minesweeper from "../puzzles/Minesweeper/Minesweeper";
import Mirror from "../puzzles/Mirror/Mirror";
import Nonogram from "../puzzles/Nonogram/Nonogram";
import Pipes from "../puzzles/Pipes/Pipes";

/**
 * Every gadget in the game, keyed to the cabin (topic) it lives in.
 *
 * All seven live in `logic-games`, not `math`: each one survives replacing every numeral with an
 * arbitrary symbol, so what they actually exercise is deduction rather than mathematics (see the
 * TopicId doc comment in src/game/types.ts). The `math` cabin therefore has ZERO entries here for
 * now — that is intentional, and a later PR fills it with genuinely mathematical games. Every
 * consumer of `gadgetsForTopic` must tolerate an empty list (see scene3d/anchors.ts and
 * cabin/CabinStatic.tsx, both of which render a normal empty room).
 */
export const GADGETS: Gadget[] = [
  {
    id: "nonogram",
    topic: "logic-games",
    label: "Nonogram",
    status: "active",
    Puzzle: Nonogram,
    hotspot: { xPct: 15, yPct: 60, label: "Nonogram" },
  },
  {
    id: "logic-grid",
    topic: "logic-games",
    label: "Logic Grid",
    status: "active",
    Puzzle: LogicGrid,
    hotspot: { xPct: 35, yPct: 60, label: "Logic Grid" },
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
    id: "minesweeper",
    topic: "logic-games",
    label: "Minesweeper",
    status: "active",
    Puzzle: Minesweeper,
    hotspot: { xPct: 25, yPct: 85, label: "Minesweeper" },
  },
  {
    id: "pipes",
    topic: "logic-games",
    label: "Pipes",
    status: "active",
    Puzzle: Pipes,
    hotspot: { xPct: 50, yPct: 85, label: "Pipes" },
  },
  {
    id: "lits",
    topic: "logic-games",
    label: "LITS",
    status: "active",
    Puzzle: LITS,
    hotspot: { xPct: 75, yPct: 85, label: "LITS" },
  },
];

export function gadgetsForTopic(topic: TopicId): Gadget[] {
  return GADGETS.filter((g) => g.topic === topic);
}

export function gadgetById(id: string): Gadget | undefined {
  return GADGETS.find((g) => g.id === id);
}
