import { beforeEach, describe, expect, it, vi } from "vitest";

const motionMock = vi.hoisted(() => ({
  useReducedMotion: vi.fn<() => boolean | null>(),
}));

vi.mock("motion/react", () => motionMock);

import { useMotionToken } from "../app/motion/useMotionToken";

describe("useMotionToken", () => {
  beforeEach(() => {
    motionMock.useReducedMotion.mockReset();
  });

  it("returns the animated domain token when reduced motion is not requested", () => {
    motionMock.useReducedMotion.mockReturnValue(false);

    expect(useMotionToken("pick")).toEqual({
      kind: "pick",
      mode: "animated",
      durationMs: 420,
      easing: "pickSpring",
    });
  });

  it("returns the exact reduced equivalent when the preference is enabled", () => {
    motionMock.useReducedMotion.mockReturnValue(true);

    expect(useMotionToken("pick")).toEqual({
      kind: "pick",
      mode: "reduced",
      durationMs: 150,
      easing: "linear",
    });
  });

  it("treats an unavailable preference as animated", () => {
    motionMock.useReducedMotion.mockReturnValue(null);

    expect(useMotionToken("press").mode).toBe("animated");
  });
});
