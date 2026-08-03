// The guide's recovery notes: what a human decided to do about a burnout/fading flag, kept so a
// reload does not lose it.
//
// SEPARATE FROM decisions.ts ON PURPOSE. A hypothesis decision (promote/park/…) folds onto the 013
// store through the domain's own actions; a recovery note is not a store transition and must not
// touch the store, the child surface, offers, or gates. It is advisory record-keeping, nothing more.
//
// SCOPE. Browser-local and synthetic, exactly like decisions.ts: real persistence is G3 (identity,
// consent, retention), and until that exists there is nowhere honest to put these but the browser
// that made them. Anything unparseable is treated as no notes rather than a thrown error, and a
// half-valid log costs the bad entries rather than the whole session.
import type { RecoveryTrigger } from "./recovery.js";

export const RECOVERY_KEY = "gt100k.guide-console.recovery";

const TRIGGERS: ReadonlySet<string> = new Set<RecoveryTrigger>([
  "BURNOUT_TIP",
  "EARLY_BURNOUT",
  "ENGAGEMENT_FADING",
]);

export interface RecoveryNote {
  readonly kidId: string;
  readonly specId: string | null;
  readonly trigger: RecoveryTrigger;
  /** The move the guide acted on, if they picked one. */
  readonly moveId?: string;
  /** What the guide chose, in their words, e.g. "Started a 1-week step-away". */
  readonly note: string;
  /** ISO timestamp of the decision. */
  readonly at: string;
}

function isNote(x: unknown): x is RecoveryNote {
  if (typeof x !== "object" || x === null) return false;
  const n = x as Partial<Record<keyof RecoveryNote, unknown>>;
  return (
    typeof n.kidId === "string" &&
    n.kidId !== "" &&
    (n.specId === null || typeof n.specId === "string") &&
    typeof n.trigger === "string" &&
    TRIGGERS.has(n.trigger) &&
    typeof n.note === "string" &&
    n.note !== "" &&
    typeof n.at === "string" &&
    (n.moveId === undefined || typeof n.moveId === "string")
  );
}

export function parseRecoveryLog(raw: string | null): RecoveryNote[] {
  if (raw === null) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(isNote);
}

/** The most recent note for a child (by ISO `at`), or null. Pure; the caller supplies the notes. */
export function latestNoteFor(notes: readonly RecoveryNote[], kidId: string): RecoveryNote | null {
  const mine = notes.filter((n) => n.kidId === kidId);
  if (mine.length === 0) return null;
  return mine.reduce((a, b) => (b.at > a.at ? b : a));
}
