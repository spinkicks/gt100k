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
 * `backdrop` — the still generated painting with clickable perspective props — is the default a
 * player sees, decided 2026-07-25 after review against the real-time 3D room. The reachable-in-WebGL
 * ceiling is a real ceiling: the hand-built room read as under-furnished, and raising it would cost
 * far more than the painting did while still losing on fidelity. Its "a still is dead" objection is
 * answered by the aliveness layer (firelight, dust in the shaft, cursor parallax).
 *
 * The others stay reachable by query param and nothing else — there is no in-app toggle (see
 * cabin/CabinView.tsx), and an unrecognised value falls through to the default rather than erroring:
 *   `?cabin=3d`      the real-time R3F room, kept intact and not deprecated
 *   `?cabin=static`  the flat-illustration backend: the no-WebGL fallback, and what the headless
 *                    screenshot tooling drives (tools/shoot.ts, tools/smoke.ts) since it needs no GPU
 */
const SELECTABLE_BACKENDS = ["static", "3d"] as const;

const requested = new URLSearchParams(globalThis.location?.search ?? "").get("cabin");
const initialBackend: CabinBackend = SELECTABLE_BACKENDS.find((b) => b === requested) ?? "backdrop";

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
