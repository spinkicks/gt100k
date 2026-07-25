import { create } from "zustand";
import type { CabinBackend, Screen, TopicId } from "./types";

interface GameState {
  screen: Screen;
  cabinId: TopicId | null;
  focusedGadgetId: string | null;
  cabinBackend: CabinBackend;
  openCabin: (id: TopicId) => void;
  focusGadget: (id: string) => void;
  closeGadget: () => void;
  goToMap: () => void;
  goToReadout: () => void;
  setBackend: (b: CabinBackend) => void;
}

/**
 * The 3D room is the only cabin backend a player ever sees, so it's the unconditional default.
 * `?cabin=static` stays as an escape hatch — the flat-illustration backend is what renders when
 * WebGL is unavailable (older machines, locked-down browsers) and it's what the headless screenshot
 * tooling drives (tools/shoot.ts, tools/smoke.ts) since it needs no GPU. There is no longer an
 * in-app toggle between the two (see cabin/CabinView.tsx); the query param is the whole interface.
 */
const initialBackend: CabinBackend =
  new URLSearchParams(globalThis.location?.search ?? "").get("cabin") === "static"
    ? "static"
    : "3d";

export const useGame = create<GameState>((set) => ({
  screen: "map",
  cabinId: null,
  focusedGadgetId: null,
  cabinBackend: initialBackend,
  openCabin: (id) => set({ screen: "cabin", cabinId: id, focusedGadgetId: null }),
  focusGadget: (id) => set({ focusedGadgetId: id }),
  closeGadget: () => set({ focusedGadgetId: null }),
  goToMap: () => set({ screen: "map", cabinId: null, focusedGadgetId: null }),
  goToReadout: () => set({ screen: "readout", focusedGadgetId: null }),
  setBackend: (b) => set({ cabinBackend: b }),
}));
