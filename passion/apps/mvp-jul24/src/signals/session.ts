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
 * WHETHER THIS APP EMITS SIGNAL RECORDS AT ALL. It does not, and that is a decision.
 *
 * The `backdrop` backend is the only one left, and its interaction surfaces — the perspective prop
 * polygons and the bookshelf — emit nothing. So a log left switched on would be *silently partial*:
 * records exist, they look well-formed, and they under-count every prop opened through the backdrop.
 * Anyone reading that data without reading this comment would treat missing engagement as absence of
 * engagement, which is the one misreading `SurfacedRecord` exists to prevent.
 *
 * PROJECT.md's instruction is "either wire the backdrop props into emission before trusting any of
 * it, or gate the backdrop out of sessions whose records are analysed. Do not split the difference."
 * Wiring emission is measurement work, deferred by decision, so this is the other branch — taken
 * explicitly, in one place, instead of left implicit.
 *
 * TO TURN IT BACK ON: wire the backdrop's prop polygons and the shelf into `recordOpen` /
 * `recordSurfaced` FIRST, then flip this. Flipping it alone reinstates the silent under-count.
 *
 * Note what this is NOT: it is not a claim the records would be wrong if complete, and it is not a
 * privacy control. It is truth-in-labelling on coverage.
 */
export const EMISSION_ENABLED = false;

const live = createSignalLog({ sessionId: SESSION_ID, now: () => Date.now() });

/**
 * A no-op with the same shape, so call sites never branch on emission. A call site that had to ask
 * "are we recording?" would eventually ask it inconsistently.
 */
const off: typeof live = {
  recordSurfaced: () => {},
  recordOpen: () => {},
  recordDepth: () => {},
  surfaced: () => [],
  interactions: () => [],
};

/** The app-wide signal log. See `EMISSION_ENABLED` for why it currently records nothing. */
export const sessionLog: typeof live = EMISSION_ENABLED ? live : off;
