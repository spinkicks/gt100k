import type { Gadget, TopicId } from '../game/types'
import LogicGrid from '../puzzles/LogicGrid/LogicGrid'
import Nonogram from '../puzzles/Nonogram/Nonogram'

export const GADGETS: Gadget[] = [
  {
    id: 'nonogram',
    topic: 'math',
    label: 'Nonogram',
    status: 'active',
    Puzzle: Nonogram,
    hotspot: { xPct: 15, yPct: 60, label: 'Nonogram' },
  },
  {
    id: 'logic-grid',
    topic: 'math',
    label: 'Logic Grid',
    status: 'active',
    Puzzle: LogicGrid,
    hotspot: { xPct: 35, yPct: 60, label: 'Logic Grid' },
  },
  {
    id: 'mirror',
    topic: 'math',
    label: 'Mirror Maze',
    status: 'coming-soon',
    hotspot: { xPct: 55, yPct: 60, label: 'Mirror Maze' },
  },
  {
    id: 'chess',
    topic: 'math',
    label: 'Chess Puzzle',
    status: 'coming-soon',
    hotspot: { xPct: 75, yPct: 60, label: 'Chess Puzzle' },
  },
  {
    id: 'minesweeper',
    topic: 'math',
    label: 'Minesweeper',
    status: 'coming-soon',
    hotspot: { xPct: 25, yPct: 85, label: 'Minesweeper' },
  },
  {
    id: 'pipes',
    topic: 'math',
    label: 'Pipes',
    status: 'coming-soon',
    hotspot: { xPct: 50, yPct: 85, label: 'Pipes' },
  },
  {
    id: 'lits',
    topic: 'math',
    label: 'LITS',
    status: 'coming-soon',
    hotspot: { xPct: 75, yPct: 85, label: 'LITS' },
  },
]

export function gadgetsForTopic(topic: TopicId): Gadget[] {
  return GADGETS.filter((g) => g.topic === topic)
}

export function gadgetById(id: string): Gadget | undefined {
  return GADGETS.find((g) => g.id === id)
}
