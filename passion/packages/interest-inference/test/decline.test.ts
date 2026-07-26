import { describe, it, expect } from "vitest";
import { foldEvents } from "../src/fold.js";
import { toBelief } from "../src/posterior.js";
import type { CellEvent, EventKind } from "../src/model.js";
import { ALPHA0, BETA0, B_DECLINED, B_SKIP } from "../src/model.js";

const NOW = Date.parse("2026-01-01T00:00:00.000Z");
const TS = "2026-01-01T00:00:00.000Z"; // age 0 → recency weight exactly 1
const KEY = "music-sound/audio-systems::build";

const ev = (kind: EventKind, choiceSetSize?: number): CellEvent => ({
  domainPath: ["music-sound", "audio-systems"],
  mode: "build",
  kind,
  novelty: false,
  timestamp: TS,
  ...(choiceSetSize === undefined ? {} : { choiceSetSize }),
});

// No prior is supplied, so alpha starts at ALPHA0 and beta at BETA0 and every increment below is
// readable directly off the constants.
const fold = (events: readonly CellEvent[]) => foldEvents(events, [], NOW).get(KEY)!;

describe("decline (E4)", () => {
  it("adds B_DECLINED / choiceSetSize to beta and nothing to alpha", () => {
    const cell = fold([ev("decline", 6)]);
    expect(cell.beta).toBeCloseTo(BETA0 + B_DECLINED / 6, 12);
    expect(cell.alpha).toBeCloseTo(ALPHA0, 12);
    expect(cell.declines).toBe(1);
    expect(cell.skips).toBe(0);
  });

  it("is far weaker than a skip at the same choice-set size — never tried is not the same as tired of", () => {
    const declined = fold([ev("decline", 6)]);
    const skipped = fold([ev("skip", 6)]);
    expect(declined.beta - BETA0).toBeLessThan(skipped.beta - BETA0);
  });
});

describe("choiceSetSize normalization (E4)", () => {
  it("divides a skip by the choice-set size; an absent size scores at full weight", () => {
    expect(fold([ev("skip", 6)]).beta).toBeCloseTo(BETA0 + B_SKIP / 6, 12);
    expect(fold([ev("skip")]).beta).toBeCloseTo(BETA0 + B_SKIP, 12);
  });

  it("floors the divisor at 1: zero and negative sizes never divide by zero or push beta down", () => {
    for (const size of [0, -1, -6]) {
      for (const kind of ["skip", "decline"] as const) {
        const cell = fold([ev(kind, size)]);
        expect(Number.isFinite(cell.beta)).toBe(true);
        expect(cell.beta).toBeGreaterThan(BETA0);
        expect(cell.beta).toBeCloseTo(BETA0 + (kind === "skip" ? B_SKIP : B_DECLINED), 12);
      }
    }
  });
});

describe("disconfirming kinds are never supporting reasons", () => {
  it("neither skip nor decline reaches positiveByKind; both are reported as disconfirming", () => {
    const cell = fold([ev("skip", 3), ev("decline", 3), ev("decline", 3)]);
    expect(cell.positiveByKind).toEqual({});
    expect(toBelief(cell).supporting).toEqual([]);
    expect(toBelief(cell).disconfirming).toEqual(["skip:1", "decline:2"]);
  });
});
