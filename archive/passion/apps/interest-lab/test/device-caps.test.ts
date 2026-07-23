import { describe, expect, it, vi } from "vitest";
import { detectDeviceCaps } from "../app/ui/deviceCaps";

describe("detectDeviceCaps", () => {
  it("detects WebGL and optional browser capability hints", () => {
    const getContext = vi.fn((kind: string) => (kind === "webgl2" ? {} : null));

    expect(
      detectDeviceCaps({
        createCanvas: () => ({ getContext }),
        navigator: {
          deviceMemory: 6,
          hardwareConcurrency: 4,
          connection: { saveData: true },
        },
        matchMedia: (query) => ({ matches: query === "(pointer: coarse)" }),
      }),
    ).toEqual({
      webglAvailable: true,
      deviceMemoryGB: 6,
      hardwareConcurrency: 4,
      coarsePointer: true,
      saveData: true,
    });
    expect(getContext).toHaveBeenCalledWith("webgl2");
  });

  it("fails closed when browser capability APIs are unavailable", () => {
    expect(detectDeviceCaps({})).toEqual({
      webglAvailable: false,
      coarsePointer: false,
      saveData: false,
    });
  });

  it("falls back to WebGL 1 when WebGL 2 is unavailable", () => {
    const getContext = vi.fn((kind: string) => (kind === "webgl" ? {} : null));

    expect(detectDeviceCaps({ createCanvas: () => ({ getContext }) }).webglAvailable).toBe(true);
    expect(getContext.mock.calls.map(([kind]) => kind)).toEqual(["webgl2", "webgl"]);
  });
});
