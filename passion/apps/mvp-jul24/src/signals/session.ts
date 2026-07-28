import { KID_ID, createSignalLog } from "./log";
import { createUplink } from "./uplink";

/**
 * One session id per page load. A session is the unit that makes a decline
 * readable: `deriveSkips` treats "surfaced this session, not engaged this
 * session" as the disconfirming signal, so the boundary has to be stable for
 * the whole load and fresh on the next one.
 */
function newSessionId(): string {
  const c = globalThis.crypto;
  if (c && "randomUUID" in c) return c.randomUUID();
  // jsdom/older browsers — uniqueness only needs to hold within a device.
  return `s-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`;
}

export const SESSION_ID = newSessionId();

/**
 * WHETHER THIS APP EMITS SIGNAL RECORDS AT ALL. It now does, and the precondition that gated it has
 * been met rather than waived.
 *
 * This was off because the `backdrop` backend's two interaction surfaces — the perspective prop
 * polygons and the bookshelf — emitted nothing, so a live log would have been *silently partial*:
 * records that exist, look well-formed, and under-count every prop opened through the backdrop.
 * Anyone reading that without reading this comment would treat missing engagement as absence of
 * engagement, which is the one misreading `SurfacedRecord` exists to prevent. The instruction was
 * "wire the backdrop's prop polygons and the shelf FIRST, then flip this."
 *
 * BOTH ARE NOW COVERED, and the first turned out to have been covered all along:
 *
 *   - **Prop polygons.** Verified by test, not by reading: clicking one calls `focusGadget`, which
 *     mounts `GadgetOverlay`, which records the open on unmount. A probe click on a real polygon
 *     produced `open:nonogram` with all four gadgets surfaced. The comment claiming otherwise had
 *     gone stale.
 *   - **The shelf.** Genuinely unwired, now emits `follow-source` when a child follows a card's
 *     outbound link — see `recordSourceFollow` for why that is the one act on the shelf worth
 *     recording, and why it is attributed to the card's subject rather than to the shelf.
 *
 * WHAT IS STILL NOT EMITTED, so this stays truth-in-labelling rather than a claim of completeness:
 * `SurfacedRecord.position` (the map and the room both have ordering, and neither reports it), and
 * `failure_recovery` / `self_authored_scope`, which have no affordance to emit from. Records are
 * complete for what the child DID; they are not yet complete for where it sat on screen.
 *
 * Note what this is NOT: it is not a privacy control. It governs whether records are WRITTEN, and
 * writing is local. Whether anything is SENT is `INGEST_URL` below, which is a separate switch on
 * purpose, and off unless someone sets it.
 */
export const EMISSION_ENABLED = true;

/**
 * Where to ship the log, if anywhere. Unset means nothing leaves the device, and that is the
 * default in every environment including this one.
 *
 * Opt-in rather than opt-out because the thing that would make egress safe does not exist yet.
 * There is no consent record, no retention rule and no erasure path in this repository (G3 is
 * unbuilt), and `KID_ID` is a fixed synthetic string rather than a real identity. A demo that
 * quietly posted a child's session somewhere would be deciding all of that by default. Setting
 * `VITE_GT100K_INGEST_URL` is a person choosing to, for a synthetic child, against a console they
 * are running.
 */
export const INGEST_URL: string | undefined = import.meta.env.VITE_GT100K_INGEST_URL || undefined;

const live = createSignalLog({ sessionId: SESSION_ID, now: () => Date.now() });

/**
 * A no-op with the same shape, so call sites never branch on emission. A call site that had to ask
 * "are we recording?" would eventually ask it inconsistently.
 */
const off: typeof live = {
  recordSurfaced: () => {},
  recordOpen: () => {},
  recordAction: () => {},
  recordDepth: () => {},
  recordSourceFollow: () => {},
  surfaced: () => [],
  interactions: () => [],
};

/** The app-wide signal log. See `EMISSION_ENABLED` for what it does and does not govern. */
export const sessionLog: typeof live = EMISSION_ENABLED ? live : off;

/**
 * Begin shipping the log, if an endpoint was configured. Returns a teardown.
 *
 * Flushes on a slow timer and when the page is hidden. The hidden case is the one that matters: a
 * child closing a tab is the normal end of a session, and `visibilitychange` is the last event that
 * reliably fires. The timer exists so a session that runs for an hour is not one lost tab away from
 * having never happened.
 *
 * Nothing here can fail loudly. Every path inside `flush` swallows its own errors, and a session
 * with no console listening behaves exactly like one with no uplink configured.
 */
export function startUplink(): () => void {
  if (!INGEST_URL || !EMISSION_ENABLED) return () => {};

  const uplink = createUplink({
    endpoint: INGEST_URL,
    kidId: KID_ID,
    interactions: () => sessionLog.interactions(),
    surfaced: () => sessionLog.surfaced(),
  });

  const flush = (): void => void uplink.flush();
  const onHide = (): void => {
    if (document.visibilityState === "hidden") flush();
  };

  const timer = window.setInterval(flush, 30_000);
  document.addEventListener("visibilitychange", onHide);
  window.addEventListener("pagehide", flush);

  return () => {
    window.clearInterval(timer);
    document.removeEventListener("visibilitychange", onHide);
    window.removeEventListener("pagehide", flush);
  };
}
