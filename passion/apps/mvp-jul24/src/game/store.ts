import { create } from "zustand";
import type { Screen, TopicId } from "./types";

interface GameState {
  screen: Screen;
  cabinId: TopicId | null;
  focusedGadgetId: string | null;
  openCabin: (id: TopicId) => void;
  focusGadget: (id: string) => void;
  closeGadget: () => void;
  goToMap: () => void;
  goToReadout: () => void;
}

/**
 * `backdrop` — the still generated painting with clickable perspective props — is the ONLY cabin
 * backend as of 2026-07-26. The `?cabin=` query param is gone along with the `3d` and `static`
 * backends it selected; both are parked (see cabin/CabinView.tsx for what that means and how to
 * reverse it). The reachable-in-WebGL ceiling is why: the hand-built room read as under-furnished,
 * and raising it would cost more than the painting did while still losing on fidelity. The "a still
 * is dead" objection is answered by the aliveness layer (firelight, dust in the shaft, parallax).
 */
export const useGame = create<GameState>((set) => ({
  screen: "map",
  cabinId: null,
  focusedGadgetId: null,
  openCabin: (id) => set({ screen: "cabin", cabinId: id, focusedGadgetId: null }),
  focusGadget: (id) => set({ focusedGadgetId: id }),
  closeGadget: () => set({ focusedGadgetId: null }),
  goToMap: () => set({ screen: "map", cabinId: null, focusedGadgetId: null }),
  goToReadout: () => set({ screen: "readout", focusedGadgetId: null }),
}));
