import type { Interaction, SurfacedRecord } from "./types";

/** Synthetic local identity — this demo holds no child PII. */
export const KID_ID = "local-demo";

const STORAGE_KEY = "mvp-jul24:signals";

/**
 * Minimum active time before an *open* counts as an interaction (proposal E9).
 * Dwell is not evidence of interest — its meaning reverses by learner — but it is
 * a serviceable validity gate: below this, a click is more likely a misclick or a
 * glance than an engagement. Never used to weight anything.
 */
export const FLOOR_MS = 20_000;

interface Stored {
  interactions: Interaction[];
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
    recordSurfaced(artifactId: string): void {
      const s = read();
      const already = s.surfaced.some(
        (r) => r.sessionId === sessionId && r.artifactId === artifactId,
      );
      if (already) return;
      s.surfaced.push({ kidId: KID_ID, artifactId, sessionId, timestamp: stamp() });
      write(s);
    },

    surfaced(): readonly SurfacedRecord[] {
      return read().surfaced;
    },

    /**
     * Record that the child opened an artifact. Gated on `activeMs` reaching
     * `FLOOR_MS` so a stray click never becomes evidence.
     */
    recordOpen(artifactId: string, activeMs: number): void {
      if (activeMs < FLOOR_MS) return;
      const s = read();
      s.interactions.push({
        kidId: KID_ID,
        artifactId,
        actionType: "open",
        timestamp: stamp(),
        prompted: false,
        sessionId,
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

    interactions(): readonly Interaction[] {
      return read().interactions;
    },
  };
}
