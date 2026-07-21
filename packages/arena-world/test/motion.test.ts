import type { CelebrationEvent, MotionSpec } from "@gt100k/arena-world";
import * as arenaWorld from "@gt100k/arena-world";
import { describe, expect, it } from "vitest";

type CelebrationMotionResolver = (
  event: CelebrationEvent,
  options: { readonly reducedMotion: boolean },
) => MotionSpec;

const celebrationMotionSpec = (
  arenaWorld as typeof arenaWorld & {
    celebrationMotionSpec?: CelebrationMotionResolver;
  }
).celebrationMotionSpec;

const EVENTS = [
  {
    type: "independent-unlock",
    nodeId: "sentence-summit",
    intensity: "high",
    copyStyle: "process-praise",
  },
  {
    type: "independent-unlock",
    nodeId: "count-cove",
    intensity: "medium",
    copyStyle: "process-praise",
  },
  {
    type: "productive-struggle",
    intensity: "low",
    copyStyle: "process-praise",
  },
] as const satisfies readonly CelebrationEvent[];

describe("celebration motion", () => {
  it("resolves the exact animated motion spec for every intensity", () => {
    expect(celebrationMotionSpec).toBeTypeOf("function");
    if (!celebrationMotionSpec) return;

    expect(EVENTS.map((event) => celebrationMotionSpec(event, { reducedMotion: false }))).toEqual([
      {
        mode: "animated",
        particleCount: 24,
        durationMs: 800,
        cameraPunch: true,
        bloomPeak: 1.4,
      },
      {
        mode: "animated",
        particleCount: 12,
        durationMs: 600,
        cameraPunch: false,
        bloomPeak: 1.1,
      },
      {
        mode: "animated",
        particleCount: 6,
        durationMs: 400,
        cameraPunch: false,
        bloomPeak: 0.7,
      },
    ]);
  });

  it("gives every intensity the exact static reduced-motion equivalent", () => {
    expect(celebrationMotionSpec).toBeTypeOf("function");
    if (!celebrationMotionSpec) return;

    expect(EVENTS.map((event) => celebrationMotionSpec(event, { reducedMotion: true }))).toEqual(
      EVENTS.map(() => ({
        mode: "static",
        particleCount: 0,
        durationMs: 150,
        cameraPunch: false,
        bloomPeak: 0.7,
      })),
    );
  });

  it("replays identical inputs deterministically through a two-argument API", () => {
    expect(celebrationMotionSpec).toBeTypeOf("function");
    if (!celebrationMotionSpec) return;

    const first = celebrationMotionSpec(EVENTS[0], { reducedMotion: false });
    const second = celebrationMotionSpec(EVENTS[0], { reducedMotion: false });

    expect(celebrationMotionSpec).toHaveLength(2);
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
    expect(first).not.toBe(second);
  });
});
