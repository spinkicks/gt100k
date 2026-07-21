import { PALETTE } from "@gt100k/interest-lab-view";
import { CanvasTexture, LinearFilter, SRGBColorSpace } from "three";

const GLOW_TEXTURE_SIZE = 128;
const TRANSPARENT_SPARK = "rgba(255, 158, 94, 0)";

export function createGlowTexture(createCanvas: () => HTMLCanvasElement): CanvasTexture {
  const canvas = createCanvas();
  canvas.width = GLOW_TEXTURE_SIZE;
  canvas.height = GLOW_TEXTURE_SIZE;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Glow texture requires a 2D canvas context");
  }

  const center = GLOW_TEXTURE_SIZE / 2;
  const gradient = context.createRadialGradient(center, center, 0, center, center, center);
  gradient.addColorStop(0, PALETTE.sparkHi);
  gradient.addColorStop(0.35, PALETTE.spark);
  gradient.addColorStop(1, TRANSPARENT_SPARK);

  context.clearRect(0, 0, GLOW_TEXTURE_SIZE, GLOW_TEXTURE_SIZE);
  context.fillStyle = gradient;
  context.fillRect(0, 0, GLOW_TEXTURE_SIZE, GLOW_TEXTURE_SIZE);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.generateMipmaps = false;
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  return texture;
}
