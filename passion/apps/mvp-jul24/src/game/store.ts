import { create } from 'zustand'
import type { TopicId, Screen, CabinBackend } from './types'

interface GameState {
  screen: Screen
  cabinId: TopicId | null
  focusedGadgetId: string | null
  cabinBackend: CabinBackend
  openCabin: (id: TopicId) => void
  focusGadget: (id: string) => void
  closeGadget: () => void
  goToMap: () => void
  goToReadout: () => void
  setBackend: (b: CabinBackend) => void
}

const initialBackend: CabinBackend =
  new URLSearchParams(globalThis.location?.search ?? '').get('cabin') === 'static' ? 'static' : '3d'

export const useGame = create<GameState>((set) => ({
  screen: 'map',
  cabinId: null,
  focusedGadgetId: null,
  cabinBackend: initialBackend,
  openCabin: (id) => set({ screen: 'cabin', cabinId: id, focusedGadgetId: null }),
  focusGadget: (id) => set({ focusedGadgetId: id }),
  closeGadget: () => set({ focusedGadgetId: null }),
  goToMap: () => set({ screen: 'map', cabinId: null, focusedGadgetId: null }),
  goToReadout: () => set({ screen: 'readout', focusedGadgetId: null }),
  setBackend: (b) => set({ cabinBackend: b }),
}))
