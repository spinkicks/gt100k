// The pure/sync discovery orchestrator (spec §3.2). Full replay + idempotent:
// append → deriveSignals (012) → runInference (011) → applyInterestRead (013) → attach artifacts.
// Never mutates inputs; never demotes on silence (inherited from 013).
import type { Interaction } from "@gt100k/signal-pipeline";
import { deriveSignals } from "@gt100k/signal-pipeline";
import { runInference } from "@gt100k/interest-inference";
import type { HypothesisStore, InterestHypothesis } from "@gt100k/hypothesis-store";
import { applyInterestRead } from "@gt100k/hypothesis-store";
import type { SurfacedRecord } from "@gt100k/signal-pipeline";
import type { StudentProfile, OrchestratorContext, CycleBatch } from "./model.js";

/**
 * Set `perseveranceArtifactRef` on hypotheses whose cellKey has a synthetic ref (pilot stand-in;
 * 013 never fabricates these). Reuses 013's id convention `${kidId}::${cellKey}`. Returns the same
 * store reference when nothing changes, so a replay cycle is a true no-op.
 */
export function attachArtifacts(
  store: HypothesisStore,
  kidId: string,
  refs: Readonly<Record<string, string>>,
): HypothesisStore {
  let changed = false;
  const byId: Record<string, InterestHypothesis> = { ...store.byId };
  for (const [cellKey, ref] of Object.entries(refs)) {
    const id = `${kidId}::${cellKey}`;
    const hyp = byId[id];
    if (hyp && hyp.perseveranceArtifactRef !== ref) {
      byId[id] = { ...hyp, perseveranceArtifactRef: ref };
      changed = true;
    }
  }
  return changed ? { byId } : store;
}

/**
 * Run one discovery cycle. `batch` is appended to the two logs (order preserved); the full history
 * is re-derived and re-inferred, applied onto the EXISTING store (preserving human transitions),
 * then synthetic perseverance artifacts are re-attached.
 *
 * Invariant (SC-2): `runCycle(p, EMPTY_BATCH, ctx, now).store` deep-equals `p.store`.
 */
export function runCycle(
  profile: StudentProfile,
  batch: CycleBatch,
  ctx: OrchestratorContext,
  now: string,
): StudentProfile {
  const interactions: readonly Interaction[] = [...profile.interactions, ...batch.interactions];
  const surfaced: readonly SurfacedRecord[] = [...profile.surfaced, ...batch.surfaced];
  // `dropped` and `silentSessions` are discarded here, and that is a known hole rather than a
  // decision. Both exist so an emitter fault is visible instead of silent, and this orchestrator is
  // what the console actually runs, so today nobody can see either. See
  // `docs/decisions/2026-07-27-no-choice-no-decline.md`.
  const { cellEvents } = deriveSignals({
    interactions,
    surfaced,
    catalog: ctx.catalog,
    config: ctx.config,
  });
  const read = runInference(cellEvents, profile.priors, Date.parse(now));
  const applied = applyInterestRead(profile.store, profile.kidId, read, now);
  const store = attachArtifacts(applied, profile.kidId, profile.perseveranceArtifacts);
  return { ...profile, interactions, surfaced, store, updatedAt: now };
}
