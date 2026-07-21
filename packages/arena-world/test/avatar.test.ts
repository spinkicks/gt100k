import { resolveAvatarAnimation } from "@gt100k/arena-world";
import { describe, expect, it } from "vitest";

const GOLDEN_ANIMATIONS = [
  {
    intent: "idle",
    animated: {
      state: "idle",
      loop: true,
      durationMs: 1600,
      easing: "Sine.InOut",
      amplitudePx: 4,
    },
    reduced: { durationMs: 0, amplitudePx: 0 },
  },
  {
    intent: "walk",
    animated: {
      state: "walk",
      loop: true,
      durationMs: 600,
      easing: "Cubic.Out",
      amplitudePx: 0,
    },
    reduced: { durationMs: 150, amplitudePx: 0 },
  },
  {
    intent: "run",
    animated: {
      state: "run",
      loop: true,
      durationMs: 380,
      easing: "Cubic.Out",
      amplitudePx: 0,
    },
    reduced: { durationMs: 150, amplitudePx: 0 },
  },
  {
    intent: "think",
    animated: {
      state: "think",
      loop: false,
      durationMs: 900,
      easing: "Sine.InOut",
      amplitudePx: 3,
    },
    reduced: { durationMs: 0, amplitudePx: 0 },
  },
  {
    intent: "celebrate-low",
    animated: {
      state: "celebrate",
      loop: false,
      durationMs: 400,
      easing: "Back.Out",
      amplitudePx: 8,
    },
    reduced: { durationMs: 150, amplitudePx: 0 },
  },
  {
    intent: "celebrate-med",
    animated: {
      state: "celebrate",
      loop: false,
      durationMs: 600,
      easing: "Back.Out",
      amplitudePx: 12,
    },
    reduced: { durationMs: 150, amplitudePx: 0 },
  },
  {
    intent: "celebrate-high",
    animated: {
      state: "celebrate",
      loop: false,
      durationMs: 800,
      easing: "Back.Out",
      amplitudePx: 16,
    },
    reduced: { durationMs: 150, amplitudePx: 0 },
  },
] as const;

describe("arena avatar animation", () => {
  it("resolves every intent to the exact animated golden row", () => {
    expect(
      GOLDEN_ANIMATIONS.map(({ intent }) =>
        resolveAvatarAnimation(intent, { reducedMotion: false }),
      ),
    ).toEqual(GOLDEN_ANIMATIONS.map(({ animated }) => animated));
  });

  it("gives every intent its exact static reduced-motion equivalent", () => {
    expect(
      GOLDEN_ANIMATIONS.map(({ intent }) =>
        resolveAvatarAnimation(intent, { reducedMotion: true }),
      ),
    ).toEqual(
      GOLDEN_ANIMATIONS.map(({ animated, reduced }) => ({
        state: `${animated.state}-static`,
        loop: false,
        durationMs: reduced.durationMs,
        easing: "Linear",
        amplitudePx: reduced.amplitudePx,
      })),
    );
  });

  it("is deterministic and carries no scale or absolute animation start", () => {
    for (const { intent } of GOLDEN_ANIMATIONS) {
      const first = resolveAvatarAnimation(intent, { reducedMotion: false });
      const second = resolveAvatarAnimation(intent, { reducedMotion: false });

      expect(second).toEqual(first);
      expect(Object.keys(first).sort()).toEqual([
        "amplitudePx",
        "durationMs",
        "easing",
        "loop",
        "state",
      ]);
      expect(JSON.stringify(first)).not.toContain('"scale":0');
    }
  });
});
