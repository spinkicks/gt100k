import { describe, expect, it } from "vitest";
import { attentionFor, attentionRank, type AttentionInputs } from "../app/attention.js";

const base: AttentionInputs = { wellbeing: [], cards: [], fading: false };
const path = ["chess"];

describe("attentionFor", () => {
  it("is STEADY with no cards, no escalation, no fading", () => {
    const a = attentionFor(base);
    expect(a.level).toBe("STEADY");
    expect(a.reason).toBe("STEADY");
    expect(a.specId).toBeNull();
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
      cards: [{ id: "c1", gatePassed: true, domainPath: path }],
      fading: true,
    });
    expect(a.reason).toBe("WELLBEING");
  });

  it("is READY when a gate has passed and nothing needs attention", () => {
    const a = attentionFor({
      ...base,
      cards: [
        { id: "c1", gatePassed: false, domainPath: path },
        { id: "c2", gatePassed: true, domainPath: ["music-sound"] },
      ],
    });
    expect(a.level).toBe("READY");
    expect(a.reason).toBe("GATE_READY");
    expect(a.specId).toBe("c2");
    expect(a.headline).toBe("Ready to promote Music & Sound");
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
