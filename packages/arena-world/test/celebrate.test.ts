import {
  type CelebrationEvent,
  type LearningMomentSignal,
  classifyCelebration,
} from "@gt100k/arena-world";
import { describe, expect, expectTypeOf, it } from "vitest";

describe("classifyCelebration", () => {
  it("classifies transfer-critical and ordinary independent unlocks", () => {
    expect(classifyCelebration).toBeTypeOf("function");
    if (!classifyCelebration) return;

    expect(
      classifyCelebration({
        type: "independent-unlock",
        nodeId: "place-value-point",
        transferCritical: true,
      }),
    ).toEqual({
      type: "independent-unlock",
      nodeId: "place-value-point",
      intensity: "high",
      copyStyle: "process-praise",
    });
    expect(
      classifyCelebration({
        type: "independent-unlock",
        nodeId: "count-cove",
        transferCritical: false,
      }),
    ).toEqual({
      type: "independent-unlock",
      nodeId: "count-cove",
      intensity: "medium",
      copyStyle: "process-praise",
    });
  });

  it("classifies productive struggle as a low process-praise event", () => {
    expect(classifyCelebration).toBeTypeOf("function");
    if (!classifyCelebration) return;

    expect(classifyCelebration({ type: "productive-struggle" })).toEqual({
      type: "productive-struggle",
      intensity: "low",
      copyStyle: "process-praise",
    });
  });

  it("returns null for incorrect attempts and help requests without touching earned state", () => {
    expect(classifyCelebration).toBeTypeOf("function");
    if (!classifyCelebration) return;

    const earnedState = Object.freeze({
      mastery: Object.freeze(["count-cove", "add-atoll"]),
      reward: 140,
      standing: Object.freeze({ selfGain: 140, gainToBandTop: 30 }),
    });
    const before = JSON.stringify(earnedState);

    expect(classifyCelebration({ type: "incorrect-attempt" })).toBeNull();
    expect(classifyCelebration({ type: "help-request" })).toBeNull();
    expect(JSON.stringify(earnedState)).toBe(before);
    expect(classifyCelebration).toHaveLength(1);
    expectTypeOf<Parameters<typeof classifyCelebration>>().toEqualTypeOf<
      [signal: LearningMomentSignal]
    >();
  });

  it("has no loss event and replays identical inputs deterministically", () => {
    type LossEvent = Extract<CelebrationEvent, { type: "loss" | "penalty" }>;

    expectTypeOf<LossEvent>().toEqualTypeOf<never>();
    expectTypeOf<CelebrationEvent["type"]>().toEqualTypeOf<
      "independent-unlock" | "productive-struggle"
    >();
    expect(classifyCelebration).toBeTypeOf("function");
    if (!classifyCelebration) return;

    const signal = {
      type: "independent-unlock",
      nodeId: "sentence-summit",
      transferCritical: true,
    } as const;
    const first = classifyCelebration(signal);
    const second = classifyCelebration(signal);

    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
    expect(first).not.toBe(second);
  });
});
