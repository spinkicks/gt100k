// The deriver `derivePlanInputs` (spec §3.6). Pure + deterministic. From the 014 StudentProfile
// interaction log for ONE cell (resolved to the canonical CellEvent stream through the tested 012
// Signal Firewall — the same path @gt100k/wellbeing's deriver takes), it reads the readiness signals:
//   • monthsInPursuit — earliest VOLUNTARY engagement → `now` (indicative only; never a gate);
//   • voluntaryReturnsRecent — voluntary returns within RETURN_WINDOW_DAYS (readiness, not age);
//   • depthAccumulation — depth-weighted sum over depth-family events (the craft-floor proxy);
//   • stretchSeeking — any `chosen_challenge` depth event;
//   • producerIdentity — a ships/shares-for-others proxy (artifact_competence / self_authored_scope);
// the 013 store supplies `hypothesisState`; the 016 `WellbeingRead` is passed through.
//
// A cell with NO voluntary engagement is NOT planned (discovery, not specialization) → returns null.
import type { StudentProfile } from "@gt100k/student-profile";
import type { HypothesisStore } from "@gt100k/hypothesis-store";
import type { WellbeingRead } from "@gt100k/wellbeing";
import { deriveSignals } from "@gt100k/signal-pipeline";
import type { Artifact } from "@gt100k/two-axis-tagging";
import { isCabinId, type DomainPath } from "@gt100k/two-axis-tagging";
import type { CellEvent } from "@gt100k/interest-inference";
import { isDepthFamily, serializeCellKey } from "@gt100k/interest-inference";
import { RETURN_WINDOW_DAYS, type PlanInputs } from "./model.js";

const DAY_MS = 86_400_000;
const MONTH_DAYS = 30;

/** The artifact catalog used to resolve the raw log to cells (default empty → nothing plannable). */
export type Catalog = ReadonlyMap<string, Artifact>;

/** Coerce an interest-inference DomainPath (`[string] | [string, string]`) to a two-axis one. */
function toDomainPath(dp: readonly string[]): DomainPath | null {
  const cabin = dp[0];
  if (cabin === undefined || !isCabinId(cabin)) return null;
  const sub = dp[1];
  return sub === undefined ? [cabin] : [cabin, sub];
}

/**
 * Derive the per-spike PlanInputs for `cellKey`. Returns `null` when the cell has no voluntary
 * engagement in the log (not a specialization cell) or the domain path is outside the taxonomy.
 */
export function derivePlanInputs(
  profile: StudentProfile,
  store: HypothesisStore,
  cellKey: string,
  wellbeing: WellbeingRead,
  now: string,
  catalog: Catalog = new Map(),
): PlanInputs | null {
  const nowMs = Date.parse(now);
  if (Number.isNaN(nowMs)) return null;

  const { cellEvents } = deriveSignals({ interactions: profile.interactions, catalog });
  const events: readonly CellEvent[] = cellEvents.filter(
    (e) => serializeCellKey(e.domainPath, e.mode) === cellKey && !Number.isNaN(Date.parse(e.timestamp)),
  );

  const voluntary = events.filter((e) => e.kind === "voluntary_return");
  if (voluntary.length === 0) return null; // discovery, not specialization

  const ageDays = (ts: string): number => (nowMs - Date.parse(ts)) / DAY_MS;
  const voluntaryReturnsRecent = voluntary.filter((e) => {
    const a = ageDays(e.timestamp);
    return a >= 0 && a <= RETURN_WINDOW_DAYS;
  }).length;

  const depthAccumulation = events
    .filter((e) => isDepthFamily(e.kind))
    .reduce((sum, e) => sum + e.magnitude, 0);

  const stretchSeeking = events.some((e) => e.kind === "chosen_challenge");
  const producerIdentity = events.some(
    (e) => e.kind === "artifact_competence" || e.kind === "self_authored_scope",
  );

  const earliestVol = Math.min(...voluntary.map((e) => Date.parse(e.timestamp)));
  const monthsInPursuit = Math.max(0, Math.floor((nowMs - earliestVol) / DAY_MS / MONTH_DAYS));

  const sample = events[0]!;
  const domainPath = toDomainPath(sample.domainPath);
  if (!domainPath) return null;

  const hyp = Object.values(store.byId).find(
    (h) => h.kidId === profile.kidId && h.cellKey === cellKey,
  );

  return {
    kidId: profile.kidId,
    cellKey,
    domainPath,
    mode: sample.mode,
    hypothesisState: hyp?.state ?? "UNKNOWN",
    monthsInPursuit,
    voluntaryReturnsRecent,
    depthAccumulation,
    stretchSeeking,
    producerIdentity,
    wellbeing,
    now,
  };
}
