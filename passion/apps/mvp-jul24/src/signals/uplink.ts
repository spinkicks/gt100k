// Shipping the log somewhere a guide can see it.
//
// Two rules shape all of this. The child's session must never depend on the console being up, so
// every failure here is swallowed and retried later rather than surfaced or thrown. And the log is
// append-only, so "what have I not sent yet" is an index rather than a diff: the watermark below is
// a count, and records before it are known-delivered.
//
// The receiver deduplicates, which is what makes the retry safe. If a response is lost after the
// server committed, the client resends and the server recognises the records it already has. So the
// worst case is a wasted round trip and never a doubled log. See `student-profile/src/ingest.ts`.
import type { EmittedInteraction, SurfacedRecord } from "./types";

const WATERMARK_KEY = "mvp-jul24:uplink-watermark";

/** How much of each log the server has acknowledged. */
interface Watermark {
  interactions: number;
  surfaced: number;
}

const ZERO: Watermark = { interactions: 0, surfaced: 0 };

function readWatermark(): Watermark {
  try {
    const raw = localStorage.getItem(WATERMARK_KEY);
    if (!raw) return { ...ZERO };
    const parsed = JSON.parse(raw) as Partial<Watermark>;
    return {
      interactions: Number.isInteger(parsed.interactions) ? parsed.interactions! : 0,
      surfaced: Number.isInteger(parsed.surfaced) ? parsed.surfaced! : 0,
    };
  } catch {
    return { ...ZERO };
  }
}

function writeWatermark(w: Watermark): void {
  try {
    localStorage.setItem(WATERMARK_KEY, JSON.stringify(w));
  } catch {
    /* quota or private mode: we will resend, and the receiver will dedupe */
  }
}

export interface UplinkOptions {
  readonly endpoint: string;
  readonly kidId: string;
  readonly interactions: () => readonly EmittedInteraction[];
  readonly surfaced: () => readonly SurfacedRecord[];
  /** Injected so tests do not reach the network. */
  readonly post?: (url: string, body: string) => Promise<boolean>;
}

const defaultPost = async (url: string, body: string): Promise<boolean> => {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    // The console is a different origin in development. A failure here is indistinguishable from
    // the console being closed, which is the normal case, so it is treated the same way.
    mode: "cors",
  });
  return res.ok;
};

export interface FlushResult {
  readonly sent: { readonly interactions: number; readonly surfaced: number };
  readonly ok: boolean;
}

/**
 * Send everything past the watermark, and advance it only on success.
 *
 * Advancing before the response would lose a batch whenever the console is restarted mid-flight,
 * and the log is the only copy. Advancing after means a lost response costs one duplicate send,
 * which the receiver absorbs.
 */
export function createUplink(opts: UplinkOptions) {
  const post = opts.post ?? defaultPost;
  let inFlight = false;

  return {
    async flush(): Promise<FlushResult> {
      // One at a time. Two concurrent flushes read the same watermark and send the same tail
      // twice, which the receiver survives but which also lets the later, shorter response advance
      // the watermark past records the earlier one is still sending.
      if (inFlight) return { sent: { interactions: 0, surfaced: 0 }, ok: false };

      const mark = readWatermark();
      const allI = opts.interactions();
      const allS = opts.surfaced();
      const interactions = allI.slice(mark.interactions);
      const surfaced = allS.slice(mark.surfaced);
      if (interactions.length === 0 && surfaced.length === 0) {
        return { sent: { interactions: 0, surfaced: 0 }, ok: true };
      }

      inFlight = true;
      try {
        const ok = await post(
          opts.endpoint,
          JSON.stringify({ kidId: opts.kidId, interactions, surfaced }),
        );
        if (ok) {
          writeWatermark({ interactions: allI.length, surfaced: allS.length });
        }
        return { sent: { interactions: interactions.length, surfaced: surfaced.length }, ok };
      } catch {
        // The console is closed, or offline, or CORS. All of them mean the same thing here: try
        // again next time, and never let the child notice.
        return { sent: { interactions: 0, surfaced: 0 }, ok: false };
      } finally {
        inFlight = false;
      }
    },

    /** Test seam: what the uplink believes has been delivered. */
    watermark(): Watermark {
      return readWatermark();
    },
  };
}
