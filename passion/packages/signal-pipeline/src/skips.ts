import type { Artifact } from "@gt100k/two-axis-tagging";
import type { CellEvent } from "@gt100k/interest-inference";
import type { SurfacedRecord, PipelineConfig } from "./model.js";
import type { BuiltEvent } from "./actions.js";
import { isNovelty, exposureKey } from "./novelty.js";

const ka = (kidId: string, artifactId: string): string => `${kidId}::${artifactId}`;

/**
 * A `skip` is disconfirming evidence about a KNOWN interest — a cell the child has actually
 * engaged before. So skips key on the artifact's *engaged* cells (from `built`), NOT on
 * affordedModes[0] (which may be a mode the child never engages). A skip fires when: the artifact
 * was surfaced in a session, the child had engaged one of its cells before, that cell is non-novel
 * by the surfaced timestamp, and the child did NOT engage it in the surfaced session.
 */
export function deriveSkips(
  surfaced: readonly SurfacedRecord[],
  built: readonly BuiltEvent[],
  catalog: ReadonlyMap<string, Artifact>,
  config: PipelineConfig,
): CellEvent[] {
  const engagedByKidArtifact = new Map<string, Map<string, string>>(); // ka -> Map<cellKey, mode>
  const firstExposure = new Map<string, number>(); // kc -> ms epoch
  const engagedBySession = new Map<string, Set<string>>(); // sessionId -> Set<cellKey>
  for (const b of built) {
    const kaKey = ka(b.event.kidId, b.event.artifactId);
    const cm = engagedByKidArtifact.get(kaKey) ?? new Map<string, string>();
    cm.set(b.cellKey, b.event.engagedModes.primary);
    engagedByKidArtifact.set(kaKey, cm);

    const t = Date.parse(b.event.timestamp);
    if (!Number.isNaN(t)) {
      const ck = exposureKey(b.event.kidId, b.cellKey);
      const prev = firstExposure.get(ck);
      if (prev === undefined || t < prev) firstExposure.set(ck, t);
    }
    const set = engagedBySession.get(b.sessionId) ?? new Set<string>();
    set.add(b.cellKey);
    engagedBySession.set(b.sessionId, set);
  }

  const out: CellEvent[] = [];
  for (const s of surfaced) {
    const art = catalog.get(s.artifactId);
    if (!art) continue;
    const engaged = engagedByKidArtifact.get(ka(s.kidId, s.artifactId));
    if (!engaged) continue; // never engaged this artifact → no known interest to skip
    const thisSession = engagedBySession.get(s.sessionId);
    for (const [cellKey, mode] of engaged) {
      if (thisSession?.has(cellKey)) continue; // engaged this session → not a skip
      if (isNovelty(firstExposure, s.kidId, cellKey, s.timestamp, config)) continue; // still novel → excluded
      out.push({ domainPath: art.domainPath, mode, kind: "skip", magnitude: 1, novelty: false, timestamp: s.timestamp });
    }
  }
  return out;
}
