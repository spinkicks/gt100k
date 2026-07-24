// src/parse.ts — schema-validate a raw (documented, ASSUMED) TimeBack API body into a `TimeBackSnapshot`.
// Pure + hermetic: no network, no side effects. FAILS SAFE — anything malformed (non-object body, a
// missing/wrong-typed `asOf` or `subjects`, or any bad subject field) yields the safe EMPTY snapshot
// (`{ kidId, asOf: epoch, subjects: [] }`), never a throw. An empty snapshot maps to an empty prior set,
// so the discovery engine simply uses its blank priors — a parse failure can NEVER gate (SC-8 fail-safe).
import type { SubjectSignal, TimeBackSnapshot } from "@gt100k/timeback";

/** The deterministic fail-safe timestamp: the epoch, so an empty snapshot is exact + testable. */
const EPOCH_ISO = new Date(0).toISOString(); // "1970-01-01T00:00:00.000Z"

/** The safe fallback: a valid, empty snapshot for `kidId`. Used on any malformation / transport error. */
function safeEmpty(kidId: string): TimeBackSnapshot {
  return { kidId, asOf: EPOCH_ISO, subjects: [] };
}

/** A finite number (rejects `NaN`/`Infinity`), used to guard `mastery` + `discretionaryXp`. */
function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

/** One raw subject entry → {@link SubjectSignal}, or `null` if ANY field is missing/wrong-typed. */
function parseSubject(raw: unknown): SubjectSignal | null {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  const { subject, mastery, discretionaryXp, offered } = o;
  if (typeof subject !== "string") return null;
  if (!isFiniteNumber(mastery)) return null;
  if (!isFiniteNumber(discretionaryXp)) return null;
  if (typeof offered !== "boolean") return null;
  return { subject, mastery, discretionaryXp, offered };
}

/**
 * Parse a documented assumed-API payload into a `TimeBackSnapshot`. On ANY malformation the whole
 * snapshot falls back to {@link safeEmpty} (all-or-nothing — never partial garbage). Never throws.
 * `kidId` always comes from the caller (the request), never the untrusted body.
 */
export function parseSnapshot(kidId: string, body: unknown): TimeBackSnapshot {
  if (typeof body !== "object" || body === null || Array.isArray(body)) return safeEmpty(kidId);
  const o = body as Record<string, unknown>;

  const asOf = o["asOf"];
  const rawSubjects = o["subjects"];
  if (typeof asOf !== "string" || !Array.isArray(rawSubjects)) return safeEmpty(kidId);

  const subjects: SubjectSignal[] = [];
  for (const raw of rawSubjects) {
    const parsed = parseSubject(raw);
    if (parsed === null) return safeEmpty(kidId); // any bad subject → whole-snapshot fallback (fail safe)
    subjects.push(parsed);
  }
  return { kidId, asOf, subjects };
}
