import type { TopicId } from '../game/types'

export interface CabinNode {
  id: TopicId
  label: string
  xPct: number
  yPct: number
  active: boolean
}

/** Cabin nodes shown on the world map. Only `math` is playable in this milestone. */
export const CABINS: CabinNode[] = [
  { id: 'math', label: 'Math & Puzzles', xPct: 50, yPct: 55, active: true },
  { id: 'music', label: 'Music', xPct: 20, yPct: 30, active: false },
  { id: 'code', label: 'Code', xPct: 78, yPct: 28, active: false },
  { id: 'art', label: 'Art', xPct: 28, yPct: 78, active: false },
]
