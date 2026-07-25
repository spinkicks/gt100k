import type { Gadget, TopicId } from "../game/types";
import Chess from "../puzzles/Chess/Chess";
import LITS from "../puzzles/LITS/LITS";
import LogicGrid from "../puzzles/LogicGrid/LogicGrid";
import Minesweeper from "../puzzles/Minesweeper/Minesweeper";
import Mirror from "../puzzles/Mirror/Mirror";
import Nonogram from "../puzzles/Nonogram/Nonogram";
import Pipes from "../puzzles/Pipes/Pipes";

export const GADGETS: Gadget[] = [
  {
    id: "nonogram",
    topic: "math",
    label: "Nonogram",
    status: "active",
    Puzzle: Nonogram,
    hotspot: { xPct: 15, yPct: 60, label: "Nonogram" },
  },
  {
    id: "logic-grid",
    topic: "math",
    label: "Logic Grid",
    status: "active",
    Puzzle: LogicGrid,
    hotspot: { xPct: 35, yPct: 60, label: "Logic Grid" },
  },
  {
    id: "mirror",
    topic: "math",
    label: "Mirror Maze",
    status: "active",
    Puzzle: Mirror,
    hotspot: { xPct: 55, yPct: 60, label: "Mirror Maze" },
  },
  {
    id: "chess",
    topic: "math",
    label: "Chess Puzzle",
    status: "active",
    Puzzle: Chess,
    hotspot: { xPct: 75, yPct: 60, label: "Chess Puzzle" },
  },
  {
    id: "minesweeper",
    topic: "math",
    label: "Minesweeper",
    status: "active",
    Puzzle: Minesweeper,
    hotspot: { xPct: 25, yPct: 85, label: "Minesweeper" },
  },
  {
    id: "pipes",
    topic: "math",
    label: "Pipes",
    status: "active",
    Puzzle: Pipes,
    hotspot: { xPct: 50, yPct: 85, label: "Pipes" },
  },
  {
    id: "lits",
    topic: "math",
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
