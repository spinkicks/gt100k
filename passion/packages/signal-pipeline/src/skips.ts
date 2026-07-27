import type { Artifact } from "@gt100k/two-axis-tagging";
import type { CellEvent } from "@gt100k/interest-inference";
import { serializeCellKey } from "@gt100k/interest-inference";
import type { SurfacedRecord, PipelineConfig } from "./model.js";
import type { BuiltEvent, Presence } from "./actions.js";
import { isNovelty, exposureKey } from "./novelty.js";

const ka = (kidId: string, artifactId: string): string => `${kidId}::${artifactId}`;
const ks = (kidId: string, sessionId: string): string => `${kidId}::${sessionId}`;

/** A cell that was on offer in a session and was not taken, with the artifact it was offered by. */
interface NotChosen {
  readonly artifact: Artifact;
  readonly mode: string;
  readonly timestamp: string;
}

/**
 * Every cell a surfaced artifact puts on offer: the cells the child has actually engaged through
 * it, then one per afforded mode.
 *
 * Both halves are needed, and for different kinds. A `skip` keys on the artifact's *engaged*
 * cells, NOT on `affordedModes[0]` — that was a real bug once: the first afforded mode may be one
 * the child never engages, so keying on it means the skip never fires for the cell they actually
 * care about. A `decline` is by definition about a cell the child has never engaged, so there is
 * no engagement to key on and the afforded modes are the only description of what was on offer.
 */
function offeredCells(
  art: Artifact,
  engaged: ReadonlyMap<string, string> | undefined,
): Map<string, string> {
  const cells = new Map<string, string>();
  if (engaged) for (const [cellKey, mode] of engaged) cells.set(cellKey, mode);
  for (const mode of art.affordedModes) cells.set(serializeCellKey(art.domainPath, mode), mode);
  return cells;
}

/**
 * Derive the two disconfirming signals from what a session offered minus what the child took.
 *
 * For each `(kidId, sessionId)`, the **not-chosen** set is every distinct cell reachable from an
 * artifact surfaced in that session that the child did not engage in that session and that is
 * past its novelty window. Choosing one gadget over six visible alternatives says something
 * (weakly) about all seven, so every event derived from the session carries
 * `choiceSetSize = |notChosen|` and 011 divides the decrement by it.
 *
 * The kind depends on whether the cell is a known interest:
 *   - **`skip`** — the child has engaged this cell before and passed it over anyway.
 *   - **`decline`** — the child has never engaged it.
 *
 * Declining something never tried is much weaker evidence than declining a known love, which is
 * why `B_DECLINED` (0.15) sits far below `B_SKIP` (0.5); but both are shares of a single choice,
 * so both are normalized. The two are mutually exclusive — one cell in one session yields at most
 * one event, or one behavioural fact would be scored twice.
 */
export function deriveSkips(
  surfaced: readonly SurfacedRecord[],
  built: readonly BuiltEvent[],
  catalog: ReadonlyMap<string, Artifact>,
  config: PipelineConfig,
  present: readonly Presence[] = [],
): CellEvent[] {
  const engagedByKidArtifact = new Map<string, Map<string, string>>(); // ka -> Map<cellKey, mode>
  const engagedCells = new Set<string>(); // exposureKey(kid, cell) — every cell this kid has engaged
  const firstExposure = new Map<string, number>(); // exposureKey -> ms epoch
  const engagedBySession = new Map<string, Set<string>>(); // ks -> Set<cellKey>
  const noteExposure = (kidId: string, cellKey: string, t: number): void => {
    const key = exposureKey(kidId, cellKey);
    const prev = firstExposure.get(key);
    if (prev === undefined || t < prev) firstExposure.set(key, t);
  };

  for (const b of built) {
    const kaKey = ka(b.event.kidId, b.event.artifactId);
    const cm = engagedByKidArtifact.get(kaKey) ?? new Map<string, string>();
    cm.set(b.cellKey, b.event.engagedModes.primary);
    engagedByKidArtifact.set(kaKey, cm);
    engagedCells.add(exposureKey(b.event.kidId, b.cellKey));

    const t = Date.parse(b.event.timestamp);
    if (!Number.isNaN(t)) noteExposure(b.event.kidId, b.cellKey, t);
    const sKey = ks(b.event.kidId, b.sessionId);
    const set = engagedBySession.get(sKey) ?? new Set<string>();
    set.add(b.cellKey);
    engagedBySession.set(sKey, set);
  }

  // Presence counts as taking, not as passing over. A mode-less action resolves to no cell, so it
  // cannot be an engagement, but it is still proof the child did not skip the thing: without this
  // the child who opened one gadget and left earns a full-weight decrement against the one cell
  // they demonstrably chose to look at. Every cell the artifact offers is marked, not just the
  // first afforded mode, or the same bug survives one mode along.
  //
  // The reverse error is real and accepted: a child who opens something, glances and leaves will
  // now suppress a decline that arguably should fire. It is the safer of the two. A false decline
  // is negative evidence against a cell the child actively chose; a missing one is a single absent
  // weak negative inside a choice set that E4 already normalises by size.
  for (const p of present) {
    const art = catalog.get(p.artifactId);
    if (!art) continue;
    const sKey = ks(p.kidId, p.sessionId);
    const set = engagedBySession.get(sKey) ?? new Set<string>();
    for (const cellKey of offeredCells(
      art,
      engagedByKidArtifact.get(ka(p.kidId, p.artifactId)),
    ).keys()) {
      set.add(cellKey);
    }
    engagedBySession.set(sKey, set);
  }

  // Record each surfacing as an exposure (see `Exposure` in novelty.ts) and group the records by
  // (kid, session), so a session's whole choice set can be counted before anything is emitted.
  // Surfacing has to count as an exposure, or a never-engaged cell would have no first-exposure at
  // all and every decline would read as novelty forever.
  const bySession = new Map<string, SurfacedRecord[]>();
  for (const s of surfaced) {
    const art = catalog.get(s.artifactId);
    if (!art) continue;
    const t = Date.parse(s.timestamp);
    if (!Number.isNaN(t)) {
      for (const cellKey of offeredCells(
        art,
        engagedByKidArtifact.get(ka(s.kidId, s.artifactId)),
      ).keys()) {
        noteExposure(s.kidId, cellKey, t);
      }
    }
    const sKey = ks(s.kidId, s.sessionId);
    const group = bySession.get(sKey) ?? [];
    group.push(s);
    bySession.set(sKey, group);
  }

  const out: CellEvent[] = [];
  for (const records of bySession.values()) {
    const { kidId, sessionId } = records[0]!;
    const engagedThisSession = engagedBySession.get(ks(kidId, sessionId));
    const notChosen = new Map<string, NotChosen>();
    for (const s of records) {
      const art = catalog.get(s.artifactId)!;
      for (const [cellKey, mode] of offeredCells(
        art,
        engagedByKidArtifact.get(ka(kidId, s.artifactId)),
      )) {
        if (notChosen.has(cellKey)) continue; // one cell offered twice in a session is still one choice
        if (engagedThisSession?.has(cellKey)) continue; // taken this session → chosen, not passed over
        if (isNovelty(firstExposure, kidId, cellKey, s.timestamp, config)) continue; // still novel → excluded
        notChosen.set(cellKey, { artifact: art, mode, timestamp: s.timestamp });
      }
    }
    const choiceSetSize = notChosen.size;
    for (const [cellKey, c] of notChosen) {
      out.push({
        domainPath: c.artifact.domainPath,
        mode: c.mode,
        kind: engagedCells.has(exposureKey(kidId, cellKey)) ? "skip" : "decline",
        novelty: false,
        timestamp: c.timestamp,
        choiceSetSize,
      });
    }
  }
  return out;
}
