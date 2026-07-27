/**
 * Cosmos palette bridge (§U8.11): maps the view model's `NodeColorRole` and the semantic tokens to
 * the exact golden hexes, re-exported from `@gt100k/evidence-explorer-view` so there is a single
 * source of truth for colour (no hard-coded duplicates on the client). Pure data, safe to import in
 * a `"use client"` module.
 *
 * These are deliberately NOT the GT tokens the rest of the app now wears. The 3D stage is the one
 * place the paper stops: a scene built from emissive bodies, additive light threads and a starfield
 * needs a dark ground to have anything to be luminous against, and on an off-white sheet it
 * collapses into pale smudges. So the stage keeps its own dark scene palette and everything around
 * it (the frame, the tier control, the Inspector that floats over it, the whole rail) is themed.
 * The `<Canvas>` is `aria-hidden` and carries no text, and the accessible Ledger states everything
 * it shows, so nothing here is a contrast surface.
 */
import { type NodeColorRole, PALETTE } from "@gt100k/evidence-explorer-view";

/** Type-hue for a node's colour role (Artifact…Outcome). */
export function roleHex(role: NodeColorRole): string {
  return PALETTE[role];
}

/** Semantic / surface tokens the cosmos needs (subset of the golden palette). */
export const COSMOS = {
  void: PALETTE.void,
  line: PALETTE.line,
  ink: PALETTE.ink,
  inkMuted: PALETTE.inkMuted,
  focus: PALETTE.focus,
  verify: PALETTE.verify,
  tamper: PALETTE.tamper,
  human: PALETTE.human,
  model: PALETTE.model,
} as const;
