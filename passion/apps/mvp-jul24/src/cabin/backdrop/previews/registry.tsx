/**
 * Which gadgets have a preview, and how a preview gets its state.
 *
 * Deliberately NOT folded into `gadgets/registry.ts`: that file is the game's list of activities and
 * is read by the map, the 3D room, the static room and the overlay. A preview renderer is a detail of
 * one cabin backend, and pushing it into the shared registry would make every backend import six
 * SVG components it never renders. Looking previews up by gadget id keeps the coupling one-way.
 */

import { useMemo } from "react";
import { useInterest } from "../../../interest/store";
import { LitsPreview } from "./LitsPreview";
import { LogicGridPreview } from "./LogicGridPreview";
import { MinesweeperPreview } from "./MinesweeperPreview";
import { MirrorPreview } from "./MirrorPreview";
import { NonogramPreview } from "./NonogramPreview";
import { PipesPreview } from "./PipesPreview";
import type { PreviewKind, PreviewSnapshot, PuzzlePreview } from "./contract";
import { buildSnapshot, isPreviewKind, previewSeed } from "./snapshots";

/**
 * Preview renderer per gadget id.
 *
 * Chess is absent on purpose — it is authored as an `object` prop (a set with pieces standing up, not
 * a plane), so there is nothing to warp a preview onto. Fraction Laser and Function Machine are
 * absent because they do not exist yet; contract.ts spells out the three-step change that adds them.
 */
const PREVIEWS: { [K in PreviewKind]: PuzzlePreview<K> } = {
  nonogram: NonogramPreview,
  "logic-grid": LogicGridPreview,
  minesweeper: MinesweeperPreview,
  pipes: PipesPreview,
  lits: LitsPreview,
  mirror: MirrorPreview,
};

export function hasPreview(gadgetId: string): boolean {
  return isPreviewKind(gadgetId);
}

/**
 * Render the preview for `snapshot`.
 *
 * The cast is the price of a discriminated union meeting a component map: TypeScript will not, on its
 * own, connect `PREVIEWS[snapshot.kind]` to `Extract<PreviewSnapshot, { kind: typeof snapshot.kind }>`
 * for a union-typed value. The narrowing is nonetheless sound — `PREVIEWS` is typed as a mapped type
 * over `PreviewKind`, so a component keyed under `"pipes"` cannot be anything but
 * `PuzzlePreview<"pipes">` — and the alternative (a six-arm switch that re-narrows by hand) trades
 * one localised cast for forty lines that a new preview has to be threaded through.
 */
export function PreviewFor({ snapshot }: { snapshot: PreviewSnapshot }): JSX.Element {
  const Preview = PREVIEWS[snapshot.kind] as PuzzlePreview<PreviewKind>;
  return <Preview snapshot={snapshot as never} />;
}

/**
 * The snapshot to paint for a gadget, or `null` when it has no preview renderer.
 *
 * Subscribes to that gadget's solve count — and only that count, so a solve on a different gadget
 * does not re-render this preview — then rebuilds the board when it changes. `useMemo` matters here:
 * `buildSnapshot` runs a real generator (the nonogram one rejects and redraws bitmaps until it finds
 * a uniquely-solvable board), and six of those on every parent render would be visible.
 *
 * See snapshots.ts for the honest account of how "live" this is and where the seam to per-keystroke
 * state goes.
 */
export function usePreviewSnapshot(gadgetId: string): PreviewSnapshot | null {
  const solves = useInterest((s) => s.byGadget[gadgetId]?.solves ?? 0);
  const kind = isPreviewKind(gadgetId) ? gadgetId : null;
  return useMemo(
    () => (kind === null ? null : buildSnapshot(kind, previewSeed(kind), solves > 0)),
    [kind, solves],
  );
}
