import { describe, expect, test } from "vitest";
import { latestNoteFor, parseRecoveryLog, type RecoveryNote } from "../app/recovery-log.js";

const NOTE: RecoveryNote = {
  kidId: "001",
  specId: "h1",
  trigger: "BURNOUT_TIP",
  moveId: "take-a-break",
  note: "Started a 1-week step-away",
  at: "2026-08-03T10:00:00.000Z",
};

describe("parseRecoveryLog", () => {
  test("round-trips a valid log", () => {
    expect(parseRecoveryLog(JSON.stringify([NOTE]))).toEqual([NOTE]);
  });
  test("returns [] for null or unparseable input", () => {
    expect(parseRecoveryLog(null)).toEqual([]);
    expect(parseRecoveryLog("{not json")).toEqual([]);
    expect(parseRecoveryLog(JSON.stringify({ not: "an array" }))).toEqual([]);
  });
  test("drops malformed entries rather than throwing", () => {
    const raw = JSON.stringify([NOTE, { kidId: 5 }, { note: "no kid" }]);
    expect(parseRecoveryLog(raw)).toEqual([NOTE]);
  });
});

describe("latestNoteFor", () => {
  test("returns the most recent note for a child, or null", () => {
    const older: RecoveryNote = { ...NOTE, note: "older", at: "2026-08-01T00:00:00.000Z" };
    expect(latestNoteFor([older, NOTE], "001")?.note).toBe("Started a 1-week step-away");
    expect(latestNoteFor([NOTE], "999")).toBeNull();
  });

  test("a logged note gives the roster something to show for a child", () => {
    expect(latestNoteFor([NOTE], "001")?.note).toBe("Started a 1-week step-away");
  });
});
