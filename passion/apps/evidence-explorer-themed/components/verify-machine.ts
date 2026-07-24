/**
 * Verify-sequence logic (§U8.8 / User Story UX3) — pure, deterministic, framework-free so it is unit
 * testable without a WebGL context and shared identically by the `VerifyPanel`, the 3D cosmos, and
 * the calm-2D constellation. It computes **no** grade and **no** crypto — pass/fail, the step set, the
 * wave order, and the Merkle roots all come from the domain-derived `VerificationView` built server-
 * side (`buildVerificationView`, §U8.8). This module only sequences the *presentation* of that truth.
 *
 * The failure framing (red + fracture + a diverging root) is reserved for the **byte-level tamper
 * body + the root diff** — never a person, learner, `Outcome`, or `Assistance` (SC-E09, UE034). That
 * invariant lives in `fractureNodeId`: it is only ever the single tampered byte-body id, and only on a
 * `mismatch` run.
 */
import type { SealState, VerificationView } from "@gt100k/evidence-explorer-view";

/** Which run the panel is showing: nothing yet, the honest verify, or the tamper demo. */
export type VerifyRun = "idle" | "verify" | "tamper";

/**
 * The visual state every tier reads to render the verify sequence (light-wave + seal + fracture).
 * Defaults (`IDLE_VISUAL`) render identically to the pre-U3 baseline, so the SSR/static render is
 * unchanged until the reviewer presses Verify.
 */
export interface VerifyVisualState {
  readonly run: VerifyRun;
  /** Domain-derived seal; `"unverified"` while idle (never produced by the domain builder). */
  readonly sealState: SealState;
  /** Leading edge of the light-wave: how many edges of `verifyWaveOrder` are lit (0…order.length). */
  readonly litEdgeCount: number;
  /** The byte-level body that fractures — only ever set on a `mismatch` run (SC-E09/UE034). */
  readonly fractureNodeId: string | null;
}

export const IDLE_VISUAL: VerifyVisualState = {
  run: "idle",
  sealState: "unverified",
  litEdgeCount: 0,
  fractureNodeId: null,
};

/**
 * Edges lit by the wave after `elapsedMs` of a `durationMs` sweep across `total` edges. A
 * non-positive duration (reduced motion / instant) lights all edges at once (§U8.5 reduced column:
 * `verifyWave` → instant + aria-live).
 */
export function waveLitCount(total: number, elapsedMs: number, durationMs: number): number {
  if (durationMs <= 0) return total;
  const p = Math.max(0, Math.min(1, elapsedMs / durationMs));
  return Math.round(p * total);
}

/** Is edge `from→to` within the lit prefix of the deterministic wave order? */
export function isEdgeLit(
  order: ReadonlyArray<{ readonly from: string; readonly to: string }>,
  litCount: number,
  from: string,
  to: string,
): boolean {
  const bound = Math.min(litCount, order.length);
  for (let i = 0; i < bound; i++) {
    const e = order[i];
    if (e !== undefined && e.from === from && e.to === to) return true;
  }
  return false;
}

/**
 * How many checklist rows are ticked after `elapsedMs` (one per `perStepMs`, §U8.5 `verifyStep`
 * 420ms). Reduced motion (`perStepMs <= 0`) reveals the whole list at once.
 */
export function revealedStepCount(
  totalSteps: number,
  elapsedMs: number,
  perStepMs: number,
): number {
  if (perStepMs <= 0) return totalSteps;
  return Math.max(0, Math.min(totalSteps, Math.floor(elapsedMs / perStepMs) + 1));
}

/** The committed Merkle root exposed by the `merkle-root` step detail (`null` if absent). */
export function merkleRootOf(view: VerificationView): string | null {
  const step = view.steps.find((s) => s.id === "merkle-root");
  const committed = step?.detail?.committed;
  return typeof committed === "string" && committed !== "" ? committed : null;
}

/** The re-derived Merkle root exposed by the `merkle-root` step detail (`null`/empty on tamper). */
export function recomputedRootOf(view: VerificationView): string | null {
  const step = view.steps.find((s) => s.id === "merkle-root");
  const recomputed = step?.detail?.recomputed;
  return typeof recomputed === "string" && recomputed !== "" ? recomputed : null;
}

/** Short mono-friendly root prefix for tickers/diffs (full root stays in the copy affordance). */
export function shortRoot(root: string | null): string {
  if (root === null) return "—";
  return root.length > 16 ? `${root.slice(0, 8)}…${root.slice(-6)}` : root;
}

/**
 * The `aria-live` announcement for a finished run — calm, precise, and explicitly non-accusatory
 * (§U8.14): the tamper announcement names the *bytes/root*, never a person, learner, or grade.
 */
export function sealAnnouncement(view: VerificationView): string {
  switch (view.sealState) {
    case "verified":
      return `Verified. Merkle root ${shortRoot(merkleRootOf(view))} re-derived and matches; every final grade is human-owned.`;
    case "mismatch":
      return "Tamper detected. The released artifact's bytes no longer match its committed Merkle root. No person, learner, or grade is implicated — only the byte-level record diverged.";
    default:
      return "Not yet verified.";
  }
}

/** Human-readable one-word status for a checklist row (spoken + shown). */
export function stepStatusLabel(status: string): string {
  switch (status) {
    case "pass":
      return "Passed";
    case "fail":
      return "Failed";
    case "stub":
      return "Pre-live stub";
    default:
      return status;
  }
}

/**
 * Resolve the visual state for a finished run against a domain view. `fractureNodeId` is set **only**
 * when the seal is `mismatch` — the single invariant that keeps red/fracture off people and grades.
 */
export function resolveVisual(
  run: VerifyRun,
  view: VerificationView | null,
  tamperNodeId: string,
  litEdgeCount: number,
): VerifyVisualState {
  if (run === "idle" || view === null) return { ...IDLE_VISUAL };
  return {
    run,
    sealState: view.sealState,
    litEdgeCount,
    fractureNodeId: view.sealState === "mismatch" ? tamperNodeId : null,
  };
}
