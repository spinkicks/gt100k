import { describe, expect, it } from "vitest";
import {
  attentionFor,
  attentionRank,
  engagementFading,
  orderByAttention,
  type AttentionInputs,
  type AttentionLevel,
} from "../app/attention.js";

const base: AttentionInputs = { wellbeing: [], cards: [], fading: false };
const path = ["chess"];

describe("attentionFor", () => {
  it("is STEADY with no cards, no escalation, no fading", () => {
    const a = attentionFor(base);
    expect(a.level).toBe("STEADY");
    expect(a.reason).toBe("STEADY");
    expect(a.specId).toBeNull();
  });

  it("STEADY with zero cards says nothing is tracked, not that nothing needs you", () => {
    // No cards is no signal at all. It must not borrow the reassuring "Nothing needs you" a
    // genuinely-observed calm child earns -- that would read a blank slate as a clean bill of health.
    expect(attentionFor(base).headline).toBe("Nothing tracked yet.");
  });

  it("STEADY with cards but none confident says signal is still gathering", () => {
    // Tracked, calm, but not yet enough evidence to be sure: distinct from both the empty slate and
    // the settled-and-sure child, so the guide knows the quiet is provisional.
    const a = attentionFor({
      ...base,
      cards: [
        { id: "c1", state: "EMERGING", gatePassed: false, confident: false, domainPath: path },
      ],
    });
    expect(a.level).toBe("STEADY");
    expect(a.headline).toBe("Quiet so far. Still gathering signal.");
  });

  it("STEADY with at least one confident card reads as settled calm", () => {
    // Evidence is sufficient and nothing is escalating or gate-ready: this is the earned "Nothing
    // needs you", the only one of the three STEADY headlines that reassures.
    const a = attentionFor({
      ...base,
      cards: [
        { id: "c1", state: "CANDIDATE", gatePassed: true, confident: true, domainPath: path },
      ],
    });
    expect(a.level).toBe("STEADY");
    expect(a.headline).toBe("Steady. Nothing needs you.");
  });

  it("flags NEEDS_YOU on a wellbeing escalation, naming the worst state", () => {
    const a = attentionFor({
      ...base,
      wellbeing: [
        { id: "w1", state: "OVER_CHALLENGED", escalateToHuman: true, domainPath: path },
        { id: "w2", state: "BURNOUT_TIP", escalateToHuman: true, domainPath: path },
      ],
    });
    expect(a.level).toBe("NEEDS_YOU");
    expect(a.reason).toBe("WELLBEING");
    expect(a.specId).toBe("w2"); // BURNOUT_TIP outranks OVER_CHALLENGED
    expect(a.headline).toBe("Close to burning out");
  });

  it("flags NEEDS_YOU when engagement is fading even if wellbeing is calm", () => {
    const a = attentionFor({ ...base, fading: true });
    expect(a.level).toBe("NEEDS_YOU");
    expect(a.reason).toBe("ENGAGEMENT_FADING");
    expect(a.headline).toBe("Interest is cooling. Returns are down.");
  });

  it("wellbeing escalation wins over both fading and gate-ready", () => {
    const a = attentionFor({
      wellbeing: [{ id: "w1", state: "GAP", escalateToHuman: true, domainPath: path }],
      cards: [{ id: "c1", state: "EMERGING", gatePassed: true, domainPath: path }],
      fading: true,
    });
    expect(a.reason).toBe("WELLBEING");
  });

  it("flags NEEDS_YOU on a family-pressure escalation, naming no spec", () => {
    // The safety win: a flagged family-pressure pattern must reach the verdict, not hide in a tab.
    const a = attentionFor({ ...base, family: { escalate: true, risk: "elevated" } });
    expect(a.level).toBe("NEEDS_YOU");
    expect(a.reason).toBe("FAMILY_PRESSURE");
    expect(a.specId).toBeNull(); // a whole-family read names no single card
    expect(a.headline).toBe("Family pressure flagged. Review before promoting.");
  });

  it("family pressure outranks a gate-ready card, so the loud one-tap Promote is withheld", () => {
    // The exact contradiction this closes: without the family read, this child is READY (one-tap
    // Promote) on the very interest the family layer flags. Family pressure must win.
    const a = attentionFor({
      ...base,
      cards: [{ id: "c1", state: "EMERGING", gatePassed: true, domainPath: path }],
      family: { escalate: true, risk: "elevated" },
    });
    expect(a.reason).toBe("FAMILY_PRESSURE");
  });

  it("family pressure outranks a fading interest but yields to a wellbeing spike", () => {
    const overFading = attentionFor({
      ...base,
      fading: true,
      family: { escalate: true, risk: "elevated" },
    });
    expect(overFading.reason).toBe("FAMILY_PRESSURE");
    const underWellbeing = attentionFor({
      wellbeing: [{ id: "w1", state: "BURNOUT_TIP", escalateToHuman: true, domainPath: path }],
      cards: [],
      fading: false,
      family: { escalate: true, risk: "elevated" },
    });
    expect(underWellbeing.reason).toBe("WELLBEING");
  });

  it("a non-escalating family read does not change the verdict", () => {
    // watch-level pressure that the engine did not escalate must not gate the promote.
    const a = attentionFor({
      ...base,
      cards: [{ id: "c1", state: "EMERGING", gatePassed: true, domainPath: path }],
      family: { escalate: false, risk: "watch" },
    });
    expect(a.reason).toBe("GATE_READY");
  });

  it("a reviewed family flag lifts the hold without cheerleading the promote", () => {
    // The bug this closes: once the guide marked the flag reviewed, the verdict fell through to the
    // green "Ready to promote X", actively urging a promote on a child whose family pressure is still
    // live. A review lifts the hold (specId points at the ready spec, so promote is reachable) but the
    // headline must stay honest -- it is the guide's judgement, not a resolved concern.
    const a = attentionFor({
      ...base,
      cards: [{ id: "c1", state: "EMERGING", gatePassed: true, domainPath: path }],
      family: { escalate: true, acknowledged: true, risk: "elevated" },
    });
    expect(a.level).toBe("READY");
    expect(a.reason).toBe("FAMILY_REVIEWED");
    expect(a.specId).toBe("c1");
    expect(a.headline).toBe("Family pressure reviewed. Promoting is your call.");
    expect(a.headline).not.toContain("Ready to promote");
  });

  it("a reviewed family flag with nothing gate-ready does not invent a promote prompt", () => {
    // Reviewing a flag on a child with no promotable spec must not manufacture a FAMILY_REVIEWED
    // "promoting is your call" -- there is nothing to promote, so it falls through to the quiet read.
    const a = attentionFor({
      ...base,
      cards: [{ id: "c1", state: "EMERGING", gatePassed: false, domainPath: path }],
      family: { escalate: true, acknowledged: true, risk: "elevated" },
    });
    expect(a.reason).not.toBe("FAMILY_REVIEWED");
    expect(a.reason).not.toBe("FAMILY_PRESSURE");
    expect(a.level).toBe("STEADY");
  });

  it("a reviewed family flag still yields to a fading interest and a wellbeing spike", () => {
    // A review is not a licence to bury a fresh safety signal: fading and wellbeing still outrank it.
    const overFading = attentionFor({
      ...base,
      cards: [{ id: "c1", state: "EMERGING", gatePassed: true, domainPath: path }],
      fading: true,
      family: { escalate: true, acknowledged: true, risk: "elevated" },
    });
    expect(overFading.reason).toBe("ENGAGEMENT_FADING");
    const underWellbeing = attentionFor({
      wellbeing: [{ id: "w1", state: "BURNOUT_TIP", escalateToHuman: true, domainPath: path }],
      cards: [{ id: "c1", state: "EMERGING", gatePassed: true, domainPath: path }],
      fading: false,
      family: { escalate: true, acknowledged: true, risk: "elevated" },
    });
    expect(underWellbeing.reason).toBe("WELLBEING");
  });

  it("is READY when a gate has passed and nothing needs attention", () => {
    const a = attentionFor({
      ...base,
      cards: [
        { id: "c1", state: "EMERGING", gatePassed: false, domainPath: path },
        { id: "c2", state: "EMERGING", gatePassed: true, domainPath: ["music-sound"] },
      ],
    });
    expect(a.level).toBe("READY");
    expect(a.reason).toBe("GATE_READY");
    expect(a.specId).toBe("c2");
    expect(a.headline).toBe("Ready to promote Music & Sound");
  });

  it("is not READY for a gate-passed card that is no longer EMERGING (already promoted)", () => {
    // The bug this guards: a promote turns an EMERGING card into a CANDIDATE but leaves its gate
    // passed, so keying "ready" off the gate alone kept the verdict advertising "Ready to promote"
    // for a child with nothing left to promote. A CANDIDATE with a passed gate is a settled act,
    // not a pending one, so the verdict must fall through to STEADY.
    const a = attentionFor({
      ...base,
      cards: [{ id: "c1", state: "CANDIDATE", gatePassed: true, domainPath: path }],
    });
    expect(a.level).toBe("STEADY");
    expect(a.reason).toBe("STEADY");
    expect(a.specId).toBeNull();
  });

  it("ignores a non-escalating wellbeing state", () => {
    const a = attentionFor({
      ...base,
      wellbeing: [{ id: "w1", state: "IN_ZONE", escalateToHuman: false, domainPath: path }],
    });
    expect(a.level).toBe("STEADY");
  });

  it("ranks needs-you before ready before steady", () => {
    expect(attentionRank("NEEDS_YOU")).toBeLessThan(attentionRank("READY"));
    expect(attentionRank("READY")).toBeLessThan(attentionRank("STEADY"));
  });
});

describe("orderByAttention", () => {
  interface Row {
    readonly id: string;
    readonly level: AttentionLevel;
  }
  const levelOf = (r: Row): AttentionLevel => r.level;

  it("puts needs-you first, then ready, then steady", () => {
    const rows: Row[] = [
      { id: "a", level: "STEADY" },
      { id: "b", level: "READY" },
      { id: "c", level: "NEEDS_YOU" },
    ];
    expect(orderByAttention(rows, levelOf).map((r) => r.id)).toEqual(["c", "b", "a"]);
  });

  it("keeps input order within a level (stable)", () => {
    const rows: Row[] = [
      { id: "a", level: "NEEDS_YOU" },
      { id: "b", level: "STEADY" },
      { id: "c", level: "NEEDS_YOU" },
      { id: "d", level: "STEADY" },
      { id: "e", level: "READY" },
    ];
    expect(orderByAttention(rows, levelOf).map((r) => r.id)).toEqual(["a", "c", "e", "b", "d"]);
  });

  it("returns an empty list for an empty input", () => {
    expect(orderByAttention([], levelOf)).toEqual([]);
  });

  it("does not mutate the input", () => {
    const rows: Row[] = [
      { id: "a", level: "STEADY" },
      { id: "b", level: "NEEDS_YOU" },
    ];
    orderByAttention(rows, levelOf);
    expect(rows.map((r) => r.id)).toEqual(["a", "b"]);
  });
});

describe("engagementFading — the ENGAGEMENT_FADING phase gate", () => {
  it("a cooling trend counts as fading when the child has an ACTIVE pursuit", () => {
    expect(engagementFading(true, [{ state: "ACTIVE" }])).toBe(true);
  });

  it("a cooling trend counts as fading when the child has a CANDIDATE pursuit", () => {
    expect(engagementFading(true, [{ state: "CANDIDATE" }])).toBe(true);
  });

  it("a cooling trend is held (not fading) when everything is still in discovery", () => {
    // You can't be fading on what you're only sampling: EMERGING/EXPLORING is discovery, and drifting
    // off a thing you tried is how sampling is supposed to work, not a specialization going cold.
    expect(engagementFading(true, [{ state: "EMERGING" }, { state: "EXPLORING" }])).toBe(false);
  });

  it("no cooling trend is never fading, whatever the phase", () => {
    expect(engagementFading(false, [{ state: "ACTIVE" }])).toBe(false);
  });

  it("a child with no cards at all is never fading", () => {
    expect(engagementFading(true, [])).toBe(false);
  });

  it("one active pursuit among many discovery cards is enough to let the trend through", () => {
    expect(
      engagementFading(true, [{ state: "EXPLORING" }, { state: "EMERGING" }, { state: "ACTIVE" }]),
    ).toBe(true);
  });
});
