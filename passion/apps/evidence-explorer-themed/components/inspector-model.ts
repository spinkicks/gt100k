/**
 * Inspector presentation model (§U5.8 / UX4) — the pure, framework-free logic behind the drill-down
 * `Inspector`. Extracted so it can be unit-tested without a DOM: given a `LedgerPanel` (the SAME
 * view-model the accessible Ledger renders — parity by construction), it derives the header badge,
 * the neutral actor chip, the copy-able content-address, the consent label, and the payload rows.
 *
 * **Evidence, never accusation (FR-E09 / §U8.14).** A `model` actor's work reads as *cited supporting
 * evidence*; a grade `Outcome` reads as *human-owned* by its named owner. Nothing here (or downstream)
 * emits blame, an "accuse" affordance, or a rank — the wording is calm and positive in every branch.
 */
import type { ActorChip, LedgerPanel, LedgerView } from "@gt100k/evidence-explorer-view";

/** A screen point (client coords) the inspector scales in from (origin-aware). */
export interface SelectionOrigin {
  readonly x: number;
  readonly y: number;
}

/** The header authority marker: a human-owned seal, a cited-assistance ribbon, or neither. */
export type HeaderBadge =
  | { readonly kind: "human-owned"; readonly text: string }
  | { readonly kind: "cited"; readonly text: string }
  | { readonly kind: "none" };

/**
 * The header badge for a panel (§U5.8). A human-owned grade `Outcome` gets a "human-owned" seal with
 * its named owner; a `model`-authored `Assistance`/`Review` gets the neutral "Declared AI assistance
 * — cited" ribbon. Never both, never an accusation.
 */
export function headerBadge(panel: LedgerPanel): HeaderBadge {
  if (panel.isHumanOwned) {
    const owner = panel.humanOwner ? ` · ${panel.humanOwner}` : "";
    return { kind: "human-owned", text: `Human-owned outcome${owner}` };
  }
  if (panel.isCitedAssistance) {
    return { kind: "cited", text: "Declared AI assistance — cited as supporting evidence" };
  }
  return { kind: "none" };
}

/** Human-readable noun per actor kind — the neutral chip label. */
const ACTOR_KIND_LABEL: Record<string, string> = {
  human: "Human",
  model: "AI model",
  tool: "Tool",
  system: "System",
};

export interface ActorChipView {
  readonly kindLabel: string;
  /** CSS tone class suffix — `model` reads in the calm `--model` hue, never alarming. */
  readonly kind: string;
  /** The pseudonymous ref (or a human display name where present). */
  readonly ref: string;
}

/** The neutral actor chip — kind noun + pseudonymous ref; no accusation, ever (§U5.8). */
export function actorChipView(actor: ActorChip): ActorChipView {
  return {
    kindLabel: ACTOR_KIND_LABEL[actor.kind] ?? actor.kind,
    kind: actor.kind,
    ref: actor.displayName ?? actor.ref,
  };
}

/** The consent-scope line, always tagged "synthetic" (§U5.8 — synthetic data only). */
export function consentLabel(panel: LedgerPanel): string {
  const { scope, purpose } = panel.consentScope;
  const p = purpose ? ` — ${purpose}` : "";
  return `${scope}${p}`;
}

/** Stringify a payload value for a described key/value row. */
function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/** Type-specific payload as ordered, display-ready [key, value] rows. */
export function payloadRows(panel: LedgerPanel): ReadonlyArray<readonly [string, string]> {
  return Object.entries(panel.payload).map(([k, v]) => [k, formatValue(v)] as const);
}

/**
 * The `transform-origin` (CSS) the inspector scales in from — the pick point expressed relative to
 * the panel's own box, so it "grows out of" the body the pointer struck. With no origin (keyboard
 * selection from the Ledger / scrub), it scales from its own centre — a calm default.
 */
export function transformOriginFor(
  origin: SelectionOrigin | null,
  rect: { readonly left: number; readonly top: number } | null,
): string {
  if (!origin || !rect) return "50% 50%";
  return `${origin.x - rect.left}px ${origin.y - rect.top}px`;
}

/** The panel for a node id from the shared Ledger view-model (null when none/ absent). */
export function panelById(view: LedgerView, id: string | null): LedgerPanel | null {
  if (!id) return null;
  return view.tree.find((t) => t.id === id)?.panel ?? null;
}
