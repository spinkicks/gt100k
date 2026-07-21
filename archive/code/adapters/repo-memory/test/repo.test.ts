import { STANDARD_CONFIG, applyFocusedTime, newDay } from "@gt100k/learning-loop";
import { describe, expect, it } from "vitest";
import { InMemoryDailyProgressRepository } from "../src/index";

describe("InMemoryDailyProgressRepository", () => {
  it("saves and reconstructs a learner's day history in order (SC-005)", async () => {
    const repo = new InMemoryDailyProgressRepository();
    const d1 = applyFocusedTime(newDay("L1", "2026-07-20", STANDARD_CONFIG), {
      id: "a",
      learnerRef: "L1",
      section: "math",
      minutes: 25,
      occurredAt: "2026-07-20T09:00:00Z",
    });
    await repo.save(d1);
    await repo.save(newDay("L1", "2026-07-21", STANDARD_CONFIG));

    const history = await repo.history("L1");
    expect(history.map((h) => h.day)).toEqual(["2026-07-20", "2026-07-21"]);
    expect(history[0]!.xpBySection.math).toBe(25);
  });

  it("isolates stored state from caller mutation", async () => {
    const repo = new InMemoryDailyProgressRepository();
    const d = newDay("L2", "2026-07-20", STANDARD_CONFIG);
    await repo.save(d);
    d.xpBySection.math = 999;
    const loaded = await repo.load("L2", "2026-07-20");
    expect(loaded!.xpBySection.math).toBe(0);
  });
});
