/**
 * Cosmos palette bridge (§U8.11) — maps the view model's `NodeColorRole` and the semantic tokens to
 * the exact golden hexes, re-exported from `@gt100k/evidence-explorer-view` so there is a single
 * source of truth for colour (no hard-coded duplicates on the client). Pure data — safe to import in
 * a `"use client"` module.
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
