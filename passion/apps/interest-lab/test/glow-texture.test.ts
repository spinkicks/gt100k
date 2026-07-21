import { PALETTE } from "@gt100k/interest-lab-view";
import { CanvasTexture, LinearFilter, SRGBColorSpace } from "three";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createGlowTexture } from "../app/child/world3d/glow-texture";

const createCanvasHarness = (withContext = true) => {
  const gradient = {
    addColorStop: vi.fn(),
  } as unknown as CanvasGradient;
  const context = {
    clearRect: vi.fn(),
    createRadialGradient: vi.fn(() => gradient),
    fillRect: vi.fn(),
    fillStyle: "",
  } as unknown as CanvasRenderingContext2D;
  const canvas = {
    height: 0,
    width: 0,
    getContext: vi.fn((kind: string) => (kind === "2d" && withContext ? context : null)),
  } as unknown as HTMLCanvasElement;

  return { canvas, context, gradient };
};

const drawingTrace = (harness: ReturnType<typeof createCanvasHarness>) => ({
  size: [harness.canvas.width, harness.canvas.height],
  clear: vi.mocked(harness.context.clearRect).mock.calls,
  radial: vi.mocked(harness.context.createRadialGradient).mock.calls,
  stops: vi.mocked(harness.gradient.addColorStop).mock.calls,
  fillStyle: harness.context.fillStyle === harness.gradient ? "gradient" : "other",
  fill: vi.mocked(harness.context.fillRect).mock.calls,
});

describe("createGlowTexture", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("draws the same warm radial halo on every in-memory canvas without fetching", () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const first = createCanvasHarness();
    const second = createCanvasHarness();

    const firstTexture = createGlowTexture(() => first.canvas);
    const secondTexture = createGlowTexture(() => second.canvas);

    expect(firstTexture).toBeInstanceOf(CanvasTexture);
    expect(firstTexture.image).toBe(first.canvas);
    expect(drawingTrace(first)).toEqual({
      size: [128, 128],
      clear: [[0, 0, 128, 128]],
      radial: [[64, 64, 0, 64, 64, 64]],
      stops: [
        [0, PALETTE.sparkHi],
        [0.35, PALETTE.spark],
        [1, "rgba(255, 158, 94, 0)"],
      ],
      fillStyle: "gradient",
      fill: [[0, 0, 128, 128]],
    });
    expect(drawingTrace(second)).toEqual(drawingTrace(first));
    expect(firstTexture.colorSpace).toBe(SRGBColorSpace);
    expect(firstTexture.generateMipmaps).toBe(false);
    expect(firstTexture.minFilter).toBe(LinearFilter);
    expect(firstTexture.magFilter).toBe(LinearFilter);
    expect(secondTexture.isCanvasTexture).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("fails clearly when a 2D canvas context is unavailable", () => {
    const { canvas } = createCanvasHarness(false);

    expect(() => createGlowTexture(() => canvas)).toThrow(
      "Glow texture requires a 2D canvas context",
    );
  });
});
