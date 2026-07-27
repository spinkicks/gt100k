import { createSignalLog } from "./log";

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
 * Note what this is NOT: it is not a privacy control, and nothing here leaves the device.
 */
export const EMISSION_ENABLED = true;

const live = createSignalLog({ sessionId: SESSION_ID, now: () => Date.now() });

/**
 * A no-op with the same shape, so call sites never branch on emission. A call site that had to ask
 * "are we recording?" would eventually ask it inconsistently.
 */
const off: typeof live = {
  recordSurfaced: () => {},
  recordOpen: () => {},
  recordDepth: () => {},
  recordSourceFollow: () => {},
  surfaced: () => [],
  interactions: () => [],
};

/** The app-wide signal log. See `EMISSION_ENABLED` for why it currently records nothing. */
export const sessionLog: typeof live = EMISSION_ENABLED ? live : off;
