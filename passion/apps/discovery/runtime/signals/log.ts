import type { DwellBucket, EmittedInteraction, SurfacedRecord } from "./types";

/** Synthetic local identity — this demo holds no child PII. */
export const KID_ID = "local-demo";

const STORAGE_KEY = "mvp-jul24:signals";

/**
 * The floor below which an open is unlikely to be a real engagement (proposal E9).
 * It classifies; it does not filter. Under-floor opens are still emitted, tagged
 * `under_floor`, because a dropped open is indistinguishable from never having
 * shown up — and "surfaced, never engaged" is what E4 scores as a decline.
 */
export const FLOOR_MS = 20_000;

/** Held attention past the first vigilance decrement (~6 min at ages 6–8). */
const LONG_MS = 6 * 60_000;
/** Past a couple of minutes: sustained, but short of the decrement. */
const MEDIUM_MS = 2 * 60_000;

function bucketFor(activeMs: number): DwellBucket {
  if (activeMs < FLOOR_MS) return "under_floor";
  if (activeMs < MEDIUM_MS) return "short";
  if (activeMs < LONG_MS) return "medium";
  return "long";
}

interface Stored {
  interactions: EmittedInteraction[];
  surfaced: SurfacedRecord[];
}

function read(): Stored {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { interactions: [], surfaced: [] };
    const parsed = JSON.parse(raw) as Partial<Stored>;
    return { interactions: parsed.interactions ?? [], surfaced: parsed.surfaced ?? [] };
  } catch {
    return { interactions: [], surfaced: [] };
  }
}

function write(s: Stored): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* quota or private mode — the log is best-effort, never blocks play */
  }
}

export interface SignalLogOptions {
  readonly sessionId: string;
  readonly now: () => number;
}

/**
 * Append-only log of `Interaction` + `SurfacedRecord`. Append-only because a
 * declined artifact has to stay on the record: "available this session and never
 * engaged" is what makes a decline distinguishable from an absence.
 */
export function createSignalLog({ sessionId, now }: SignalLogOptions) {
  const stamp = () => new Date(now()).toISOString();

  return {
    /**
     * Note the artifact was available this session. Idempotent per
     * (session, artifact): availability is a session-level fact, so re-renders
     * must not inflate it.
     */
    recordSurfaced(artifactId: string, position?: number): void {
      const s = read();
      const already = s.surfaced.some(
        (r) => r.sessionId === sessionId && r.artifactId === artifactId,
      );
      if (already) return;
      s.surfaced.push({
        kidId: KID_ID,
        artifactId,
        sessionId,
        timestamp: stamp(),
        ...(position === undefined ? {} : { position }),
      });
      write(s);
    },

    surfaced(): readonly SurfacedRecord[] {
      return read().surfaced;
    },

    /**
     * Record that the child opened an artifact. Always emitted, carrying a
     * `dwellBucket` so the engine can decide what a brief visit is worth. The
     * emitter reports; it does not adjudicate.
     */
    recordOpen(artifactId: string, activeMs: number): void {
      const s = read();
      s.interactions.push({
        kidId: KID_ID,
        artifactId,
        actionType: "open",
        timestamp: stamp(),
        prompted: false,
        sessionId,
        dwellBucket: bucketFor(activeMs),
      });
      write(s);
    },

    /**
     * Record that the child DID the thing: solved the puzzle, completed the build.
     *
     * The only record this app writes that can form a cell. An `open` deliberately resolves to no
     * work-mode, because being somewhere is not a way of working, so without this the engine sees
     * presence and never engagement — which was true for weeks and is what `catalog.ts` and this
     * method together fix. `actionType` is the gadget's solve verb from the crosswalk, because that
     * is what `resolveEngagedModes` reads to decide which cell the event lands in.
     *
     * `depthSignals` ride HERE rather than being their own interaction. A depth kind is not an
     * action and does not resolve to a mode on its own, so `recordDepth`'s records were silently
     * discarded as `unresolved-action`. Attached to a real verb they arrive.
     */
    recordAction(
      artifactId: string,
      verb: string,
      depth?: readonly string[],
      tries?: number,
    ): void {
      const s = read();
      s.interactions.push({
        kidId: KID_ID,
        artifactId,
        actionType: verb,
        timestamp: stamp(),
        prompted: false,
        sessionId,
        ...(depth && depth.length > 0
          ? { depthSignals: depth.map((kind) => ({ kind, value: 1 })) }
          : {}),
        ...(typeof tries === "number" && tries > 0 ? { tries } : {}),
      });
      write(s);
    },

    /**
     * Record a depth-family signal. Never floor-gated: a depth signal is a
     * discrete accomplished action, so its evidential value does not depend on
     * how long it took.
     */
    recordDepth(artifactId: string, kind: string): void {
      const s = read();
      s.interactions.push({
        kidId: KID_ID,
        artifactId,
        actionType: kind,
        timestamp: stamp(),
        prompted: false,
        sessionId,
        depthSignals: [{ kind, value: 1 }],
      });
      write(s);
    },

    /**
     * Record that the child followed a shelf card's source link out of the product.
     *
     * The one act on the shelf worth recording. The surface owner's ruling deliberately leaves open
     * whether the child leaves to learn or stays and does the activity
     * (`docs/decisions/2026-07-27-discovery-surface.md` §-1), and this is the only place that
     * question produces data rather than argument. Recording it presumes neither answer.
     *
     * `subjectId` is the card's own subject — the gadget for an activity card, the cabin for the
     * invitation — and never the shelf. A child who follows the invitation's link has moved from the
     * puzzle to the field, which is precisely the distinction the invitation card exists to create
     * and the one E10's delayed report codes for. Collapsing both onto "the shelf" would throw it
     * away.
     *
     * Not floor-gated: following a link is a discrete act, complete the moment it happens.
     */
    recordSourceFollow(subjectId: string): void {
      const s = read();
      s.interactions.push({
        kidId: KID_ID,
        artifactId: subjectId,
        actionType: "follow-source",
        timestamp: stamp(),
        prompted: false,
        sessionId,
      });
      write(s);
    },

    interactions(): readonly EmittedInteraction[] {
      return read().interactions;
    },
  };
}
