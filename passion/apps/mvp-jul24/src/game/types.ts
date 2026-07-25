export type TopicId = 'math' | 'music' | 'code' | 'art' | 'science' | 'words'
export type Screen = 'map' | 'cabin' | 'readout'
export type CabinBackend = '3d' | 'static'

export interface GadgetHotspot {
  xPct: number
  yPct: number
  label: string
}

export interface PuzzleProps {
  seed: number
  onSolved: () => void
  onExit: () => void
}

export interface Gadget {
  id: string
  topic: TopicId
  label: string
  hotspot: GadgetHotspot
  status: 'active' | 'coming-soon'
  Puzzle?: React.ComponentType<PuzzleProps>
}
