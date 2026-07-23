import { describe, it, expect } from "vitest";
import { emptyStore, applyInterestRead, getForKid } from "../src/store.js";
import type { InterestRead } from "@gt100k/interest-inference";

const NOW = "2026-02-01T00:00:00.000Z";
function read(confident: boolean, lowerBound: number): InterestRead {
  return {
    cells: [
      {
        cellKey: "music-sound/audio-systems::build",
        domainPath: ["music-sound", "audio-systems"],
        mode: "build",
        alpha: 5,
        beta: 1.5,
        mean: 0.77,
        sd: 0.14,
        lowerBound,
        evidenceMass: 4.5,
        confident,
        attribution: confident ? "style" : null,
        supporting: ["voluntary_return"],
        disconfirming: [],
      },
    ],
    candidates: confident
      ? [
          {
            cellKey: "music-sound/audio-systems::build",
            domainPath: ["music-sound", "audio-systems"],
            mode: "build",
            lowerBound,
            attribution: "style",
          },
        ]
      : [],
  };
}

describe("applyInterestRead", () => {
  it("creates EXPLORING, auto-advances to EMERGING when confident, bumps version + history", () => {
    let s = applyInterestRead(emptyStore(), "kid-1", read(false, 0.4), NOW);
    let h = getForKid(s, "kid-1")[0]!;
    expect(h.state).toBe("EXPLORING");
    expect(h.version).toBe(1);
    s = applyInterestRead(s, "kid-1", read(true, 0.64), "2026-02-08T00:00:00.000Z");
    h = getForKid(s, "kid-1")[0]!;
    expect(h.state).toBe("EMERGING");
    expect(h.version).toBe(2);
    expect(h.history.at(-1)!.to).toBe("EMERGING");
    expect(h.history.at(-1)!.actor).toBe("SYSTEM");
  });

  it("auto-advances to EMERGING on the CREATION path when already confident", () => {
    const s = applyInterestRead(emptyStore(), "kid-2", read(true, 0.7), NOW);
    const h = getForKid(s, "kid-2")[0]!;
    expect(h.state).toBe("EMERGING");
    expect(h.version).toBe(1);
  });

  it("sets CONTESTED when lowerBound falls below threshold after being above", () => {
    let s = applyInterestRead(emptyStore(), "kid-1", read(true, 0.7), NOW);
    expect(getForKid(s, "kid-1")[0]!.state).toBe("EMERGING");
    s = applyInterestRead(s, "kid-1", read(true, 0.5), "2026-03-01T00:00:00.000Z");
    expect(getForKid(s, "kid-1")[0]!.state).toBe("CONTESTED");
  });

  it("never mutates the input store (immutable value)", () => {
    const s0 = emptyStore();
    const s1 = applyInterestRead(s0, "kid-1", read(true, 0.7), NOW);
    expect(Object.keys(s0.byId)).toHaveLength(0);
    expect(Object.keys(s1.byId)).toHaveLength(1);
  });
});
