/**
 * Discovery-gadget registry + shared visual state.
 *
 * The cabin is scattered with little interactables the child walks up to (proximity) and activates
 * (press E / click). Each activation is a *discovery* — a satisfying visible change AND a behavioral
 * interest signal fed into the recorder (see gadgetSignals.ts). The set deliberately probes several
 * interest FAMILIES (tinker / engineering / mechanical / music / art / code) so the discovery loop
 * can see breadth of curiosity, not a single scored track.
 *
 * State design (determinism): each gadget has a fixed, deterministic REST `defaultMode`. Rendering
 * reads only `mode` + clock time, and clock is frozen to `GADGET_FROZEN_T` under `?freeze=1`, so the
 * harness shots are reproducible. The `?act=` URL param forces gadgets into their showcase mode so
 * the "discovered" state can be screenshotted deterministically without walking the player there.
 */

/** Interest families a gadget probes. `code` is the desk coding-station (opens the TasteApp). */
export type GadgetDomain = "tinker" | "engineering" | "mechanical" | "music" | "art" | "code";

export interface GadgetDef {
  id: string;
  /** short affordance label shown in the proximity prompt */
  label: string;
  domain: GadgetDomain;
  /** proximity target (metres) — the spot the player stands to interact */
  target: readonly [number, number, number];
  /** proximity radius (metres) */
  radius: number;
  /** number of activation states (mode cycles 0..modes-1 on each press) */
  modes: number;
  /** deterministic REST mode the gadget boots into */
  defaultMode: number;
  /** the "fully on" mode used for ?act= showcase shots + a first-press jump-to-on */
  showcaseMode: number;
}

/**
 * The interactables, placed around the room (see cabin/scene/layout.ts for wall extents).
 * `code-station` is the existing desk taste-app anchor, folded in so ONE interaction manager owns
 * the press-E edge (no two zones fighting over `intent.interact`).
 */
export const GADGETS: readonly GadgetDef[] = [
  {
    id: "code-station",
    label: "the coding station",
    domain: "code",
    target: [-3.0, 0, -0.6],
    radius: 1.5,
    modes: 2,
    defaultMode: 0,
    showcaseMode: 1,
  },
  {
    id: "lamp",
    label: "the desk lamp",
    domain: "tinker",
    // off · warm · cool · bright — a hands-on light to fiddle with
    target: [-2.8, 0, 0.5],
    radius: 1.15,
    modes: 4,
    defaultMode: 1,
    showcaseMode: 3,
  },
  {
    id: "panel",
    label: "the control panel",
    domain: "engineering",
    target: [-1.9, 0, 2.15],
    radius: 1.25,
    modes: 2,
    defaultMode: 0,
    showcaseMode: 1,
  },
  {
    id: "gizmo",
    label: "the gear contraption",
    domain: "mechanical",
    target: [-2.55, 0, 2.0],
    radius: 1.2,
    modes: 2,
    defaultMode: 0,
    showcaseMode: 1,
  },
  {
    id: "chimes",
    label: "the chime keys",
    domain: "music",
    target: [2.45, 0, 1.95],
    radius: 1.2,
    modes: 2,
    defaultMode: 0,
    showcaseMode: 1,
  },
  {
    id: "easel",
    label: "the paint easel",
    domain: "art",
    // cycles through paint colours
    target: [2.2, 0, -1.7],
    radius: 1.2,
    modes: 4,
    defaultMode: 0,
    showcaseMode: 2,
  },
] as const;

/** frozen clock phase for `?freeze=1` (matches Cabin's FROZEN_T so all animation settles together) */
export const GADGET_FROZEN_T = 1.5;

export interface GadgetVisualState {
  mode: number;
  /** true once the player has activated it at least once this session */
  discovered: boolean;
}

export type GadgetStore = Record<string, GadgetVisualState>;

const byId = new Map(GADGETS.map((g) => [g.id, g]));

export function gadgetDef(id: string): GadgetDef | undefined {
  return byId.get(id);
}

/**
 * Build the initial store. Gadgets boot into their deterministic `defaultMode`; any id in `act`
 * (or every gadget when `act` contains "all") is forced to its showcase mode + marked discovered,
 * so `?act=all` renders the fully-activated scene for a deterministic "after" screenshot.
 */
export function createGadgetStore(act: readonly string[] = []): GadgetStore {
  const all = act.includes("all");
  const store: GadgetStore = {};
  for (const g of GADGETS) {
    const on = all || act.includes(g.id);
    store[g.id] = {
      mode: on ? g.showcaseMode : g.defaultMode,
      discovered: on,
    };
  }
  return store;
}

/**
 * Advance a gadget on a press. First activation jumps straight to the showcase (fully-on) mode so
 * the discovery reads immediately; subsequent presses cycle through the remaining modes and back to
 * off. Returns the new mode + whether this press was the first discovery of that gadget.
 */
export function activateGadget(
  store: GadgetStore,
  id: string,
): { mode: number; firstTime: boolean } {
  const def = byId.get(id);
  const st = store[id];
  if (!def || !st) return { mode: 0, firstTime: false };
  const firstTime = !st.discovered;
  st.mode = firstTime ? def.showcaseMode : (st.mode + 1) % def.modes;
  st.discovered = true;
  return { mode: st.mode, firstTime };
}
