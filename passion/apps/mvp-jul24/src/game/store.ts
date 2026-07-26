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
 * tooling drives (tools/shoot.ts, tools/smoke.ts) since it needs no GPU. `?cabin=backdrop` selects
 * the still-generated-painting backend (src/cabin/backdrop/), which is under review and deliberately
 * NOT a default. There is no in-app toggle between any of them (see cabin/CabinView.tsx); the query
 * param is the whole interface, and an unrecognised value falls through to 3D rather than erroring.
 */
const SELECTABLE_BACKENDS = ["static", "backdrop"] as const;

const requested = new URLSearchParams(globalThis.location?.search ?? "").get("cabin");
const initialBackend: CabinBackend = SELECTABLE_BACKENDS.find((b) => b === requested) ?? "3d";

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
