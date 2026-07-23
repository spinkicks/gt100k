import { describe, expect, it } from "vitest";
import {
  RETURN_GAP_MS,
  SignalRecorder,
  type TasteSession,
  deriveHypothesis,
} from "../cabin/src/interest/signals";

/** Minimal in-memory Storage for deterministic recorder tests. */
function memStore(seed: Record<string, string> = {}): Storage {
  const m = new Map<string, string>(Object.entries(seed));
  return {
    get length() {
      return m.size;
    },
    clear: () => m.clear(),
    getItem: (k) => m.get(k) ?? null,
    key: (i) => [...m.keys()][i] ?? null,
    removeItem: (k) => m.delete(k),
    setItem: (k, v) => {
      m.set(k, v);
    },
  } as Storage;
}

function session(over: Partial<TasteSession>): TasteSession {
  return {
    startedAt: 0,
    endedAt: 100,
    edits: 0,
    runs: 0,
    failedRuns: 0,
    retriesAfterFail: 0,
    solved: false,
    msToFirstRun: null,
    msActive: 100,
    ...over,
  };
}

describe("deriveHypothesis", () => {
  it("is EXPLORING for a quick bounce", () => {
    const h = deriveHypothesis(session({ msActive: 3000 }), 0, 1);
    expect(h.state).toBe("EXPLORING");
    expect(h.reasons.some((r) => r.includes("weak") || r.includes("bounced"))).toBe(true);
  });

  it("is EMERGING with real engagement", () => {
    const h = deriveHypothesis(session({ runs: 2, edits: 5, retriesAfterFail: 1 }), 0, 1);
    expect(h.state).toBe("EMERGING");
  });

  it("is CANDIDATE only with voluntary return + iterate-past-failure + solved", () => {
    const h = deriveHypothesis(
      session({ runs: 3, edits: 6, retriesAfterFail: 1, solved: true }),
      1,
      4,
    );
    expect(h.state).toBe("CANDIDATE");
    expect(h.domain).toBe("code");
    expect(h.workMode).toBe("debug");
  });
});

describe("SignalRecorder", () => {
  it("counts a successful fix after a fail as iterate-past-failure and solved", () => {
    const rec = new SignalRecorder(1000, memStore());
    rec.edit();
    rec.edit();
    rec.run(1100, false); // first attempt fails
    rec.run(1200, true); // fixed it → follows a fail
    const h = rec.end(1300);
    expect(h.lastSession?.retriesAfterFail).toBe(1);
    expect(h.lastSession?.solved).toBe(true);
    expect(h.lastSession?.msToFirstRun).toBe(100);
    expect(h.totalSessions).toBe(1);
    expect(h.voluntaryReturns).toBe(0); // first ever session is not a "return"
  });

  it("marks a session a voluntary return when the gap since last exceeds the threshold", () => {
    const store = memStore();
    new SignalRecorder(0, store).end(1000); // session 1 ends at t=1000
    const rec2 = new SignalRecorder(1000 + RETURN_GAP_MS + 1, store); // long gap later
    rec2.run(1000 + RETURN_GAP_MS + 50, true);
    const h = rec2.end(1000 + RETURN_GAP_MS + 100);
    expect(h.voluntaryReturns).toBe(1);
    expect(h.totalSessions).toBe(2);
    expect(h.reasons.some((r) => r.includes("voluntary return"))).toBe(true);
  });
});
