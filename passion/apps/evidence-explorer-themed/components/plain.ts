/**
 * Plain-mode copy + audio-caption ids (UE045, §U5.9 / §U5.10) — pure, framework-free presentation
 * helpers so they're unit-testable without a DOM.
 *
 * **Plain mode** (§U12 low-spectacle): the render drops the starfield / glow / grade (a visual flag
 * threaded to the tiers) AND the drill-down panels swap jargon for a plain sentence via `panelCopy`.
 * It is *state-identical* to full — it only changes wording + spectacle, never the `ExplorerView`
 * (SC-E02/E03 / `plainViewEquals`).
 *
 * **Audio captions** (§U5.10, muted default): this slice ships **caption ids only** — no audio asset
 * pipeline. `resolveSoundCue(event)` is the deterministic, neutral caption id; `sealCaption` maps a
 * verify seal state to its caption (never an alarm).
 */
import type { SealState } from "@gt100k/evidence-explorer-view";

/** Jargon-vs-plain wording for the inspector / Ledger described panels. */
export interface PanelCopy {
  readonly addressLabel: string;
  readonly addressNote: string;
  readonly inputsEmpty: string;
}

/** Full (default) copy — the precise, technical wording. */
export const FULL_COPY: PanelCopy = {
  addressLabel: "Content-address",
  addressNote: "content-addressed — the id is the hash of the content",
  inputsEmpty: "No upstream inputs (a source of the milestone).",
};

/** Plain-mode copy — the same facts in plain sentences (no jargon). */
export const PLAIN_COPY: PanelCopy = {
  addressLabel: "Fingerprint",
  addressNote: "This id is a fingerprint of the item's exact contents.",
  inputsEmpty: "Nothing came before this — it's a starting point.",
};

/** The panel copy for the current plain-mode flag (presentation-only). */
export function panelCopy(plainMode: boolean): PanelCopy {
  return plainMode ? PLAIN_COPY : FULL_COPY;
}

/** Neutral, deterministic audio-caption ids (§U5.10) — never an alarm, no cue loops. */
export type CueEvent = "verified" | "step" | "mismatch";

const CAPTION_IDS: Record<CueEvent, string> = {
  verified: "[verified]",
  step: "[check]",
  mismatch: "[mismatch]",
};

/** The caption id for a cue event (deterministic; a later, non-breaking sound pipeline can reuse it). */
export function resolveSoundCue(event: CueEvent): string {
  return CAPTION_IDS[event];
}

/** The verify-seal caption for a seal state (null when there is nothing to announce yet). */
export function sealCaption(sealState: SealState): string | null {
  if (sealState === "verified") return CAPTION_IDS.verified;
  if (sealState === "mismatch") return CAPTION_IDS.mismatch;
  return null;
}
