/**
 * Behavioral signal capture for the Discovery loop (PRD §14 / DISCOVERY-APP-PRD §6).
 *
 * The cabin's "first taste" is instrumented, not scored. We record what the child *did* — edits,
 * runs, retries after failure, dwell time, voluntary return after novelty fades — and fold it into a
 * revisable `InterestHypothesis` for the (domain × work-mode) cell this cabin probes: code × debug.
 *
 * Design guardrails carried from the PRD:
 *  - never a scalar "passion score" or a fixed label — a hypothesis with a state + reasons.
 *  - "iterate past a failure" (retry-after-fail) is the signal that matters, not completion alone.
 *  - voluntary *return* (a fresh session with no prompt) is the strongest signal — tracked across
 *    sessions via localStorage, distinct from prompted re-engagement.
 *  - missingness ≠ disinterest.
 */

export const DOMAIN = "code" as const;
export const WORK_MODE = "debug" as const;

export type HypothesisState = "EXPLORING" | "EMERGING" | "CANDIDATE";

/** One instrumented taste session's raw behavioral counters. */
export interface TasteSession {
  startedAt: number;
  endedAt: number | null;
  edits: number; // block moves / toggles
  runs: number; // times the child ran the program
  failedRuns: number; // runs that didn't solve it
  retriesAfterFail: number; // a run that followed a failed run (perseverance)
  solved: boolean;
  msToFirstRun: number | null;
  msActive: number;
}

export interface InterestHypothesis {
  domain: typeof DOMAIN;
  workMode: typeof WORK_MODE;
  state: HypothesisState;
  /** count of distinct voluntary (unprompted) sessions started */
  voluntaryReturns: number;
  totalSessions: number;
  /** human-readable supporting / disconfirming reasons — never a bare number */
  reasons: string[];
  lastSession: TasteSession | null;
}

interface PersistedState {
  voluntaryReturns: number;
  totalSessions: number;
  lastEndedAt: number | null;
}

const STORAGE_KEY = "tinker-cabin.interest.v1";
/** a session started after this long since the last one counts as a "voluntary return" (novelty faded) */
export const RETURN_GAP_MS = 6 * 60 * 60 * 1000; // 6h

function loadPersisted(store: Storage | null): PersistedState {
  if (!store) return { voluntaryReturns: 0, totalSessions: 0, lastEndedAt: null };
  try {
    const raw = store.getItem(STORAGE_KEY);
    if (!raw) return { voluntaryReturns: 0, totalSessions: 0, lastEndedAt: null };
    const p = JSON.parse(raw) as Partial<PersistedState>;
    return {
      voluntaryReturns: p.voluntaryReturns ?? 0,
      totalSessions: p.totalSessions ?? 0,
      lastEndedAt: p.lastEndedAt ?? null,
    };
  } catch {
    return { voluntaryReturns: 0, totalSessions: 0, lastEndedAt: null };
  }
}

/**
 * Accumulates one taste session and derives the hypothesis. `now` is injected so the recorder is
 * deterministic + testable (no hidden Date.now); the app passes performance.now()/Date.now().
 */
export class SignalRecorder {
  private readonly store: Storage | null;
  private readonly session: TasteSession;
  private readonly persisted: PersistedState;
  private readonly isVoluntaryReturn: boolean;

  constructor(now: number, store: Storage | null = safeStorage()) {
    this.store = store;
    this.persisted = loadPersisted(store);
    this.isVoluntaryReturn =
      this.persisted.lastEndedAt !== null && now - this.persisted.lastEndedAt >= RETURN_GAP_MS;
    this.session = {
      startedAt: now,
      endedAt: null,
      edits: 0,
      runs: 0,
      failedRuns: 0,
      retriesAfterFail: 0,
      solved: false,
      msToFirstRun: null,
      msActive: 0,
    };
  }

  edit(): void {
    this.session.edits++;
  }

  /** record a program run; `now` for timing, `success` whether it solved the puzzle. */
  run(now: number, success: boolean): void {
    const followedFail = this.lastRunFailed; // any run after a failed run = iterate-past-failure
    this.session.runs++;
    if (this.session.msToFirstRun === null)
      this.session.msToFirstRun = now - this.session.startedAt;
    if (followedFail) this.session.retriesAfterFail++;
    if (success) {
      this.session.solved = true;
      this.lastRunFailed = false;
    } else {
      this.session.failedRuns++;
      this.lastRunFailed = true;
    }
  }

  private lastRunFailed = false;

  /** finalize the session, persist return-tracking, and return the updated hypothesis. */
  end(now: number): InterestHypothesis {
    this.session.endedAt = now;
    this.session.msActive = now - this.session.startedAt;
    const totalSessions = this.persisted.totalSessions + 1;
    const voluntaryReturns = this.persisted.voluntaryReturns + (this.isVoluntaryReturn ? 1 : 0);
    if (this.store) {
      try {
        const next: PersistedState = { voluntaryReturns, totalSessions, lastEndedAt: now };
        this.store.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* storage full/blocked — signals still returned in-memory */
      }
    }
    return deriveHypothesis(this.session, voluntaryReturns, totalSessions);
  }
}

/** Pure hypothesis derivation from a finished session + cross-session return counts. */
export function deriveHypothesis(
  session: TasteSession,
  voluntaryReturns: number,
  totalSessions: number,
): InterestHypothesis {
  const reasons: string[] = [];
  if (session.retriesAfterFail > 0)
    reasons.push(`persevered: ${session.retriesAfterFail} retry(s) after a failed run`);
  if (session.solved) reasons.push("solved the contraption");
  if (session.edits >= 6) reasons.push(`hands-on: ${session.edits} edits`);
  if (voluntaryReturns > 0)
    reasons.push(`voluntary return x${voluntaryReturns} after novelty faded`);
  if (session.msActive < 8000 && session.runs === 0)
    reasons.push("bounced quickly — weak signal (missingness ≠ disinterest)");

  // state: EXPLORING by default; EMERGING with real engagement; CANDIDATE needs voluntary return +
  // iterate-past-failure (the graduation-gate constructs), never from a single session.
  let state: HypothesisState = "EXPLORING";
  const engaged = session.runs >= 1 && (session.edits >= 4 || session.retriesAfterFail >= 1);
  if (engaged) state = "EMERGING";
  if (voluntaryReturns >= 1 && session.retriesAfterFail >= 1 && session.solved) state = "CANDIDATE";

  return {
    domain: DOMAIN,
    workMode: WORK_MODE,
    state,
    voluntaryReturns,
    totalSessions,
    reasons,
    lastSession: session,
  };
}

function safeStorage(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}
