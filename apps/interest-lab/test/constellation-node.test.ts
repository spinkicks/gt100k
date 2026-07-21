import { PALETTE } from "@gt100k/interest-lab-view";
import { CanvasTexture, LinearFilter, SRGBColorSpace } from "three";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  colorForPull,
  createSoftDotTexture,
  resolveAnchorNode,
  resolveStarNode,
} from "../app/guide/constellation-node";

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

const star = (
  pull: "supporting" | "disconfirming" | "neutral",
  brightness: number,
): Parameters<typeof resolveStarNode>[0] => ({
  family: "voluntary_return",
  pull,
  brightness,
  position: [0, 0, 0],
});

describe("createSoftDotTexture", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("draws a tint-ready white radial dot in memory without fetching", () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const { canvas, context, gradient } = createCanvasHarness();

    const texture = createSoftDotTexture(() => canvas);

    expect(texture).toBeInstanceOf(CanvasTexture);
    expect(texture.image).toBe(canvas);
    expect([canvas.width, canvas.height]).toEqual([128, 128]);
    expect(vi.mocked(context.createRadialGradient).mock.calls).toEqual([[64, 64, 0, 64, 64, 64]]);
    // Pure white → transparent white, so the sprite material colour is the only tint.
    expect(vi.mocked(gradient.addColorStop).mock.calls).toEqual([
      [0, "rgba(255, 255, 255, 1)"],
      [0.28, "rgba(255, 255, 255, 0.55)"],
      [1, "rgba(255, 255, 255, 0)"],
    ]);
    expect(context.fillStyle).toBe(gradient);
    expect(vi.mocked(context.clearRect).mock.calls).toEqual([[0, 0, 128, 128]]);
    expect(vi.mocked(context.fillRect).mock.calls).toEqual([[0, 0, 128, 128]]);
    expect(texture.colorSpace).toBe(SRGBColorSpace);
    expect(texture.generateMipmaps).toBe(false);
    expect(texture.minFilter).toBe(LinearFilter);
    expect(texture.magFilter).toBe(LinearFilter);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("fails clearly when a 2D canvas context is unavailable", () => {
    const { canvas } = createCanvasHarness(false);

    expect(() => createSoftDotTexture(() => canvas)).toThrow(
      "Constellation node texture requires a 2D canvas context",
    );
  });
});

describe("colorForPull", () => {
  it("maps each pull to a palette tone", () => {
    expect(colorForPull("supporting")).toBe(PALETTE.sparkHi);
    expect(colorForPull("disconfirming")).toBe(PALETTE.tide);
    expect(colorForPull("neutral")).toBe(PALETTE.inkHi);
  });
});

describe("resolveStarNode", () => {
  it("tints the node by pull and wraps a small core in a wider halo", () => {
    const node = resolveStarNode(star("supporting", 0.5));

    expect(node.color).toBe(PALETTE.sparkHi);
    // The soft halo always reads larger than the hot core.
    expect(node.haloScale).toBeGreaterThan(node.coreScale * 3);
  });

  it("scales brightness monotonically and clamps opacity to unit range", () => {
    const dim = resolveStarNode(star("neutral", 0));
    const bright = resolveStarNode(star("neutral", 1));

    expect(bright.coreScale).toBeGreaterThan(dim.coreScale);
    expect(bright.haloScale).toBeGreaterThan(dim.haloScale);
    expect(bright.coreOpacity).toBeGreaterThan(dim.coreOpacity);
    expect(bright.haloOpacity).toBeGreaterThan(dim.haloOpacity);

    for (const node of [dim, bright, resolveStarNode(star("neutral", 5))]) {
      expect(node.coreOpacity).toBeLessThanOrEqual(1);
      expect(node.haloOpacity).toBeLessThanOrEqual(1);
      expect(node.coreOpacity).toBeGreaterThanOrEqual(0);
      expect(node.haloOpacity).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("resolveAnchorNode", () => {
  it("reads as a hotter, wider beacon than an average star", () => {
    const anchor = resolveAnchorNode(0.11, PALETTE.tide);

    expect(anchor.color).toBe(PALETTE.tide);
    expect(anchor.haloScale).toBeGreaterThan(anchor.coreScale);
    expect(anchor.coreOpacity).toBeGreaterThan(0.8);
  });
});
