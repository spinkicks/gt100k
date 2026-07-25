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

/** The app-wide append-only signal log. */
export const sessionLog = createSignalLog({ sessionId: SESSION_ID, now: () => Date.now() });
