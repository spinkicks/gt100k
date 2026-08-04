/**
 * What an adult's word is worth.
 *
 * Most of these are about refusal. This channel is the one place a grown-up's opinion enters a
 * system built to read children's behaviour, and the failure mode is not that a parent lies. It is
 * that adults sincerely report what a child is good at rather than what a child likes, that the
 * academically legible gets named far more often, and that letting a report establish an interest
 * reproduces the gifted-nomination literature, where gating on adult referral produces false
 * negatives above 60% and refers high-scoring Black students at half the rate.
 */
import { describe, expect, it } from "vitest";

import {
  MIN_SIGHTING_DAYS,
  NO_REPORTS,
  REPORT_WINDOW_DAYS,
  restDirection,
  scorable,
  stakesAdvice,
  stakesWindow,
  type AdultReports,
  type Sighting,
} from "../src/index.js";

const CELL = "games-strategy/chess::investigate";
let n = 0;
const sighting = (over: Partial<Sighting> = {}): Sighting => ({
  id: `s${++n}`,
  kidId: "kid-1",
  reporter: "parent",
  at: "2026-08-04T18:00:00.000Z",
  what: "Set the board up on her own and played through a book game",
  days: ["2026-08-01", "2026-08-03"],
  cellKey: CELL,
  ...over,
});

const reports = (over: Partial<AdultReports> = {}): AdultReports => ({
  ...NO_REPORTS,
  ...over,
});

describe("which sightings count", () => {
  it("counts an episode seen across more than one day", () => {
    const { counted } = scorable(reports({ sightings: [sighting()] }));
    expect(counted).toHaveLength(1);
  });

  it("records a single day and scores nothing for it", () => {
    // One afternoon is an afternoon. The whole value of an adult report is reaching a context we
    // cannot see, and a habit is what makes that worth a fraction of a unit of evidence.
    const one = sighting({ days: ["2026-08-01"] });
    const { counted, refused } = scorable(reports({ sightings: [one] }));
    expect(counted).toHaveLength(0);
    expect(refused[0]?.why).toBe("one-day-only");
  });

  it("records a sighting nobody attributed, and scores nothing for it", () => {
    // A guide can still read "he has been drawing dragons for a fortnight". It just cannot move a
    // belief about a cell no one named.
    const { counted, refused } = scorable(
      reports({ sightings: [sighting({ cellKey: undefined })] }),
    );
    expect(counted).toHaveLength(0);
    expect(refused[0]?.why).toBe("no-cell");
  });

  it("lets one enthusiastic adult count only once per window", () => {
    // THE LOAD-BEARING ONE. Without it a parent keen on chess files a sighting a day and walks a
    // hypothesis up on their own opinion, which is the mechanism the nomination literature warns
    // about, arriving through the back door.
    const daily = [0, 1, 2, 3, 4].map((d) =>
      sighting({ at: `2026-08-0${d + 1}T18:00:00.000Z`, days: ["2026-07-28", "2026-07-30"] }),
    );
    const { counted } = scorable(reports({ sightings: daily }));
    expect(counted).toHaveLength(1);
  });

  it("counts again once the window has passed", () => {
    const later = new Date(
      Date.parse("2026-08-04T18:00:00.000Z") + (REPORT_WINDOW_DAYS + 1) * 86_400_000,
    ).toISOString();
    const { counted } = scorable(reports({ sightings: [sighting(), sighting({ at: later })] }));
    expect(counted).toHaveLength(2);
  });

  it("keeps different cells independent", () => {
    const { counted } = scorable(
      reports({
        sightings: [sighting(), sighting({ cellKey: "music-sound/instruments::perform" })],
      }),
    );
    expect(counted).toHaveLength(2);
  });

  it("is deterministic regardless of the order they were written in", () => {
    const a = sighting({ at: "2026-08-01T10:00:00.000Z" });
    const b = sighting({ at: "2026-08-02T10:00:00.000Z" });
    const forwards = scorable(reports({ sightings: [a, b] })).counted.map((s) => s.id);
    const backwards = scorable(reports({ sightings: [b, a] })).counted.map((s) => s.id);
    expect(forwards).toEqual(backwards);
  });

  it("requires more than one day, whatever that constant is set to", () => {
    expect(MIN_SIGHTING_DAYS).toBeGreaterThan(1);
  });
});

describe("whether a child is running down", () => {
  const rest = (direction: "seems-fine" | "flagging" | "worn-out", at: string) => ({
    kidId: "kid-1",
    reporter: "parent" as const,
    at,
    direction,
    because: "quieter than usual after practice",
  });

  it("takes the most recent read, not an average", () => {
    // A direction someone observed on a day, not a quantity to pool. Averaging "worn out in March"
    // against "fine in August" produces a number describing nobody.
    const r = reports({
      rest: [
        rest("worn-out", "2026-07-01T00:00:00.000Z"),
        rest("seems-fine", "2026-08-01T00:00:00.000Z"),
      ],
    });
    expect(restDirection(r, "2026-08-04T00:00:00.000Z")).toBe("seems-fine");
  });

  it("ignores a read too old to mean anything", () => {
    const r = reports({ rest: [rest("worn-out", "2026-01-01T00:00:00.000Z")] });
    expect(restDirection(r, "2026-08-04T00:00:00.000Z")).toBeUndefined();
  });

  it("says nothing when nobody has been asked", () => {
    expect(restDirection(NO_REPORTS, "2026-08-04T00:00:00.000Z")).toBeUndefined();
  });

  it("is never a number", () => {
    // No threshold exists to fire on: Mind Garden withdrew every MBI cut-off in 2016 for having no
    // diagnostic validity. A direction is the most this can honestly be.
    const r = reports({ rest: [rest("worn-out", "2026-08-03T00:00:00.000Z")] });
    expect(typeof restDirection(r, "2026-08-04T00:00:00.000Z")).toBe("string");
  });
});

describe("something with stakes coming up", () => {
  const event = (on: string) => ({
    kidId: "kid-1",
    kind: "competition" as const,
    what: "county chess tournament",
    on,
    cellKey: CELL,
  });

  it("opens a week out", () => {
    const w = stakesWindow(reports({ stakes: [event("2026-08-09")] }), "2026-08-04T09:00:00.000Z");
    expect(w?.phase).toBe("week-before");
  });

  it("treats the day itself as its own phase", () => {
    // Confidence falls inside the last couple of hours while anxiety rises, so the day is not the
    // tail of the week and the advice differs.
    const w = stakesWindow(reports({ stakes: [event("2026-08-04")] }), "2026-08-04T09:00:00.000Z");
    expect(w?.phase).toBe("day-of");
  });

  it("stays open briefly afterwards, because the ride home is the part that matters", () => {
    const w = stakesWindow(reports({ stakes: [event("2026-08-03")] }), "2026-08-04T09:00:00.000Z");
    expect(w?.phase).toBe("after");
  });

  it("ignores something months away", () => {
    expect(
      stakesWindow(reports({ stakes: [event("2026-12-01")] }), "2026-08-04T09:00:00.000Z"),
    ).toBeUndefined();
  });

  it("reads a child against the nearest thing, not the biggest", () => {
    const w = stakesWindow(
      reports({ stakes: [event("2026-08-10"), event("2026-08-05")] }),
      "2026-08-04T09:00:00.000Z",
    );
    expect(w?.event.on).toBe("2026-08-05");
  });
});

describe("what we tell the adult", () => {
  const at = (on: string, now: string) =>
    stakesWindow(reports({ stakes: [{ kidId: "k", kind: "competition", what: "x", on }] }), now);

  it("tells them to wait afterwards, rather than to be encouraging", () => {
    // The finding is about who speaks first. Children disengaged when a parent opened the review,
    // including a supportive one, and talked warmly at length when they opened it themselves.
    const w = at("2026-08-03", "2026-08-04T09:00:00.000Z");
    expect(stakesAdvice(w!)).toMatch(/raise it first|let them/i);
  });

  it("never tells an adult to coach on the day", () => {
    const w = at("2026-08-04", "2026-08-04T09:00:00.000Z");
    expect(stakesAdvice(w!)).not.toMatch(/\b(advice|tips|remind them to|practise)\b/i);
  });

  it("says something different in each phase", () => {
    const said = new Set(
      [
        at("2026-08-09", "2026-08-04T09:00:00.000Z"),
        at("2026-08-04", "2026-08-04T09:00:00.000Z"),
        at("2026-08-03", "2026-08-04T09:00:00.000Z"),
      ].map((w) => stakesAdvice(w!)),
    );
    expect(said.size).toBe(3);
  });

  it("never promises an outcome or mentions winning", () => {
    for (const on of ["2026-08-09", "2026-08-04", "2026-08-03"]) {
      const said = stakesAdvice(at(on, "2026-08-04T09:00:00.000Z")!);
      expect(said).not.toMatch(/\bwin\b|\bbeat\b|\bplace\b|\bmedal\b/i);
    }
  });
});
