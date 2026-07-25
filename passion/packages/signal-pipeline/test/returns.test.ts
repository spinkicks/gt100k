// The return-horizon classifier (E2). `cross_day_return` is the only shape that counts as evidence
// of durable interest, so the interesting cases here are the ones that must NOT reach it: a
// first-ever engagement, a same-session reopen, and a same-day return in a different session.
import { describe, it, expect } from "vitest";
import type { Artifact } from "@gt100k/two-axis-tagging";
import { classifyReturns } from "../src/returns.js";
import { deriveSignals } from "../src/pipeline.js";
import { buildActionEvents } from "../src/actions.js";
import { DEFAULTS, type Interaction } from "../src/model.js";

const synth: Artifact = {
  id: "synth-01",
  domainPath: ["music-sound", "audio-systems"],
  affordedModes: ["perform", "build", "investigate"],
  kind: "gadget",
  source: "gold",
  origin: "seed",
  tagConfidence: 1,
  tagStatus: "TRUSTED",
};
const drum: Artifact = { ...synth, id: "drum-01", domainPath: ["music-sound", "percussion"] };
const CATALOG: ReadonlyMap<string, Artifact> = new Map([
  ["synth-01", synth],
  ["drum-01", drum],
]);

function tap(timestamp: string, sessionId: string, extra: Partial<Interaction> = {}): Interaction {
  return {
    kidId: "k",
    artifactId: "synth-01",
    actionType: "assemble",
    timestamp,
    prompted: false,
    sessionId,
    ...extra,
  };
}

/** Classify a raw log the way the pipeline does, and return one entry per interaction. */
function classify(interactions: readonly Interaction[]) {
  const { built } = buildActionEvents(interactions, CATALOG, DEFAULTS);
  return classifyReturns(built);
}

describe("classifyReturns", () => {
  it("a first-ever engagement is same_day_engagement, with no dayGap", () => {
    const [first] = classify([tap("2026-02-01T09:00:00.000Z", "s1")]);
    expect(first).toEqual({ kind: "same_day_engagement" });
  });

  it("two engagements of the same cell on different UTC days → cross_day_return with the day gap", () => {
    const out = classify([
      tap("2026-02-01T23:00:00.000Z", "s1"),
      tap("2026-02-04T01:00:00.000Z", "s2"),
    ]);
    expect(out[0]).toEqual({ kind: "same_day_engagement" });
    expect(out[1]).toEqual({ kind: "cross_day_return", dayGap: 3 });
  });

  it("counts whole UTC days, so two hours across midnight is still a one-day gap", () => {
    const out = classify([
      tap("2026-02-01T23:00:00.000Z", "s1"),
      tap("2026-02-02T01:00:00.000Z", "s2"),
    ]);
    expect(out[1]).toEqual({ kind: "cross_day_return", dayGap: 1 });
  });

  it("two engagements in the same session → same_day_engagement, no dayGap", () => {
    const out = classify([
      tap("2026-02-01T09:00:00.000Z", "s1"),
      tap("2026-02-01T09:00:30.000Z", "s1"),
    ]);
    expect(out[1]).toEqual({ kind: "same_day_engagement" });
    expect(out[1]!.dayGap).toBeUndefined();
  });

  it("different sessions on the SAME UTC day → still same_day_engagement", () => {
    // The proposal did not specify this case. Grouping it with the unscored kinds is deliberate:
    // a return hours later has not survived a night away, which is what the evidence rewards.
    const out = classify([
      tap("2026-02-01T08:00:00.000Z", "morning"),
      tap("2026-02-01T20:00:00.000Z", "evening"),
    ]);
    expect(out[1]).toEqual({ kind: "same_day_engagement" });
  });

  it("only the SAME cell counts as a predecessor", () => {
    const out = classify([
      tap("2026-02-01T09:00:00.000Z", "s1", { artifactId: "drum-01" }),
      tap("2026-02-03T09:00:00.000Z", "s2"),
    ]);
    expect(out[1]).toEqual({ kind: "same_day_engagement" }); // first touch of the synth cell
  });

  it("a prompted engagement is still prompted_return", () => {
    const out = classify([
      tap("2026-02-01T09:00:00.000Z", "s1"),
      tap("2026-02-03T09:00:00.000Z", "s2", { prompted: true }),
      tap("2026-02-05T09:00:00.000Z", "s3"),
    ]);
    expect(out[1]).toEqual({ kind: "prompted_return" });
    // A prompted touch is still a touch, so it is a valid predecessor for the next voluntary one.
    expect(out[2]).toEqual({ kind: "cross_day_return", dayGap: 2 });
  });

  it("unsorted input classifies identically to sorted input", () => {
    const sorted = [
      tap("2026-02-01T09:00:00.000Z", "s1"),
      tap("2026-02-01T15:00:00.000Z", "s2"),
      tap("2026-02-03T09:00:00.000Z", "s3"),
      tap("2026-02-08T09:00:00.000Z", "s4"),
    ];
    const shuffled = [sorted[2]!, sorted[0]!, sorted[3]!, sorted[1]!];
    const byTimestamp = (log: readonly Interaction[]) =>
      new Map(classify(log).map((c, i) => [log[i]!.timestamp, c]));
    expect(byTimestamp(shuffled)).toEqual(byTimestamp(sorted));
    expect(byTimestamp(sorted).get("2026-02-08T09:00:00.000Z")).toEqual({
      kind: "cross_day_return",
      dayGap: 5,
    });
  });
});

describe("classification through deriveSignals", () => {
  it("the secondary-mode event carries the same kind and dayGap as its primary", () => {
    // `tinker` resolves to build primary + investigate secondary (009 ACTION_MODE_RULES).
    const log: Interaction[] = [
      tap("2026-02-01T09:00:00.000Z", "s1", { actionType: "tinker" }),
      tap("2026-02-05T09:00:00.000Z", "s2", { actionType: "tinker" }),
    ];
    const { cellEvents } = deriveSignals({ interactions: log, catalog: CATALOG });
    const returns = cellEvents.filter((c) => c.timestamp === "2026-02-05T09:00:00.000Z");
    expect(returns.map((c) => c.mode)).toEqual(["build", "investigate"]);
    expect(returns[1]!.role).toBe("secondary");
    for (const c of returns) {
      expect(c.kind).toBe("cross_day_return");
      expect(c.dayGap).toBe(4);
    }
  });
});
