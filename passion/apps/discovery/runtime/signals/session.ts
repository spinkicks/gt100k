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
 * WHETHER THIS APP EMITS SIGNAL RECORDS AT ALL. It does. The precondition that once gated it — that
 * every interaction surface actually be wired, so a live log is never *silently partial* — is the
 * bar this comment has to keep honest, because a record that exists, looks well-formed, and
 * under-counts is the one misreading `SurfacedRecord` exists to prevent.
 *
 * WHAT THE DISCOVERY WALL EMITS, surface by surface:
 *
 *   - **Every tile.** The browse wall records each topic tile as surfaced with its grid position the
 *     moment a screen is shown (`page.tsx`). Topic ids are browse-level: they do not resolve in the
 *     crosswalk, so they anchor position and offered-set counts but never form a skip on their own.
 *   - **Every game in the panel.** Each game offered at a cell is surfaced with its position too, and
 *     these DO resolve to catalog artifacts — so a game surfaced and never engaged is what
 *     `deriveSkips` reads as a decline. Opening one records an `open` (presence, with a dwell bucket)
 *     via `PuzzleHost`; solving records the gadget's crosswalk verb (the one record that forms a
 *     work-mode cell); asking for a harder board records that same verb tagged `chosen_challenge`.
 *   - **The resource links.** Following a curated link out records `follow-source`, attributed to the
 *     resource the child opened — see `recordSourceFollow` for why that subject, not the tile. For
 *     the thirty-six pursuits with no game this is the only act that can become evidence.
 *
 * WHAT IS STILL NOT EMITTED, so this stays truth-in-labelling rather than a claim of completeness:
 * `self_authored_scope` and `unrequired_revision`, which have no affordance on this surface to emit
 * from. `failure_recovery` used to be on that list and no longer is: chess reports each attempt, so
 * a solve that took more than one go carries it. Records are complete for what the child DID.
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
 * `NEXT_PUBLIC_GT100K_INGEST_URL` is a person choosing to, for a synthetic child, against a console
 * they are running.
 */
export const INGEST_URL: string | undefined =
  process.env.NEXT_PUBLIC_GT100K_INGEST_URL || undefined;

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
    displayName: "Demo Child",
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
