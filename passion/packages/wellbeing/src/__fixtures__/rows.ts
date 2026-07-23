// One synthetic `WellbeingSignals` bundle per §6.2 decision-table row (SYNTHETIC ONLY), used by the
// golden table test + the guardrail tests. Each bundle is the MINIMAL signal set that lands on its
// row given the priority order (BURNOUT_TIP → EARLY_BURNOUT → GAP → DANGER_WINDOW → OVER_CHALLENGED
// → UNDER_CHALLENGED → IN_ZONE).
import type { WellbeingSignals } from "../model.js";

const NOW = "2026-04-01T00:00:00.000Z";
const base = (over: Partial<WellbeingSignals>): WellbeingSignals => ({
  kidId: "kid-synthetic-001",
  cellKey: "music-sound/audio-systems::build",
  returnTrend: "stable",
  depthTrend: "stable",
  now: NOW,
  ...over,
});

/** Row 1 — quiet devaluation: still shows up, stops going deep → BURNOUT_TIP. */
export const BURNOUT_TIP_SIGNALS: WellbeingSignals = base({
  returnTrend: "declining",
  depthTrend: "declining",
  devaluation: true,
});

/** Row 2 — early exhaustion pattern (no devaluation) → EARLY_BURNOUT. */
export const EARLY_BURNOUT_SIGNALS: WellbeingSignals = base({
  returnTrend: "declining",
  depthTrend: "declining",
  exhaustion: true,
});

/** Row 3 — a per-spike quiet period (≥ GAP_DAYS) → GAP. */
export const GAP_SIGNALS: WellbeingSignals = base({ missing: true });

/** Row 4 — a stakes event (competition / deadline / audience) → DANGER_WINDOW. */
export const DANGER_WINDOW_SIGNALS: WellbeingSignals = base({ stakesEvent: true });

/** Row 5 — success below the scaffold threshold, not rising → OVER_CHALLENGED. */
export const OVER_CHALLENGED_SIGNALS: WellbeingSignals = base({
  returnTrend: "stable",
  successRate: 0.55,
});

/** Row 6 — push ONLY from strength: rising return + rising depth + stretch-seeking → UNDER_CHALLENGED. */
export const UNDER_CHALLENGED_SIGNALS: WellbeingSignals = base({
  returnTrend: "rising",
  depthTrend: "rising",
  successRate: 0.95,
  stretchSeeking: true,
});

/** Row 7 — otherwise → IN_ZONE. */
export const IN_ZONE_SIGNALS: WellbeingSignals = base({
  returnTrend: "stable",
  depthTrend: "stable",
  successRate: 0.85,
});
