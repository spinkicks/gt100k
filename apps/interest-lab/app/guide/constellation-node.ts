import { type ConstellationStar, PALETTE } from "@gt100k/interest-lab-view";
import { CanvasTexture, LinearFilter, SRGBColorSpace } from "three";

const SOFT_DOT_SIZE = 128;

/**
 * A white radial-gradient sprite (opaque hot centre → transparent rim). Drawn once and
 * tinted per node via the sprite material `color`, so a single texture glows in every
 * pull tone. Kept in-memory (no network) exactly like the world halo texture.
 */
export function createSoftDotTexture(createCanvas: () => HTMLCanvasElement): CanvasTexture {
  const canvas = createCanvas();
  canvas.width = SOFT_DOT_SIZE;
  canvas.height = SOFT_DOT_SIZE;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Constellation node texture requires a 2D canvas context");
  }

  const center = SOFT_DOT_SIZE / 2;
  const gradient = context.createRadialGradient(center, center, 0, center, center, center);
  gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
  gradient.addColorStop(0.28, "rgba(255, 255, 255, 0.55)");
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

  context.clearRect(0, 0, SOFT_DOT_SIZE, SOFT_DOT_SIZE);
  context.fillStyle = gradient;
  context.fillRect(0, 0, SOFT_DOT_SIZE, SOFT_DOT_SIZE);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.generateMipmaps = false;
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  return texture;
}

export function colorForPull(pull: ConstellationStar["pull"]): string {
  if (pull === "supporting") return PALETTE.sparkHi;
  if (pull === "disconfirming") return PALETTE.tide;
  return PALETTE.inkHi;
}

export interface GlowNode {
  color: string;
  coreScale: number;
  haloScale: number;
  coreOpacity: number;
  haloOpacity: number;
}

const clampUnit = (value: number): number => Math.min(1, Math.max(0, value));

/**
 * Resolve a star into a glowing node: a small bright core wrapped in a soft additive
 * halo (~5× the core), both scaled by the star's brightness. This is what turns the
 * flat balls into legible points of light — the "glowing node" bar for the guide.
 */
export function resolveStarNode(star: Readonly<ConstellationStar>): GlowNode {
  const brightness = clampUnit(star.brightness);

  return {
    color: colorForPull(star.pull),
    coreScale: 0.05 + brightness * 0.06,
    haloScale: 0.26 + brightness * 0.3,
    coreOpacity: clampUnit(0.7 + brightness * 0.3),
    haloOpacity: clampUnit(0.2 + brightness * 0.34),
  };
}

/**
 * Anchor poles read as brighter beacons the pull-lines converge on, so they carry a
 * hotter core and a wider halo than an average star.
 */
export function resolveAnchorNode(baseScale: number, color: string): GlowNode {
  return {
    color,
    coreScale: baseScale * 0.62,
    haloScale: baseScale * 2.4,
    coreOpacity: 0.86,
    haloOpacity: 0.5,
  };
}
