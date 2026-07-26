import { describe, expect, it } from "vitest";
import { artToBox, fitArt, fitTransform, svgPreserveAspectRatio } from "./fit";

const ART_W = 1536;
const ART_H = 1024;

describe("fitArt — cover", () => {
  it("scales to the wider axis and centres the overflow", () => {
    // 16:9 box against 3:2 art: the box is relatively wider, so width drives the scale and the art
    // overflows vertically by an equal amount top and bottom.
    const fit = fitArt(1600, 900, ART_W, ART_H);
    expect(fit.scale).toBeCloseTo(1600 / 1536, 12);
    expect(fit.offsetX).toBeCloseTo(0, 12);
    expect(fit.offsetY).toBeCloseTo((900 - 1024 * (1600 / 1536)) / 2, 12);
    expect(fit.offsetY).toBeLessThan(0);
  });

  it("scales to the taller axis when the box is relatively narrow", () => {
    const fit = fitArt(800, 900, ART_W, ART_H);
    expect(fit.scale).toBeCloseTo(900 / 1024, 12);
    expect(fit.offsetY).toBeCloseTo(0, 12);
    expect(fit.offsetX).toBeLessThan(0);
  });

  it("is exact and offset-free when the box matches the art's aspect ratio", () => {
    const fit = fitArt(768, 512, ART_W, ART_H);
    expect(fit).toEqual({ scale: 0.5, offsetX: 0, offsetY: 0 });
  });
});

describe("fitArt — contain", () => {
  it("letterboxes instead of overflowing", () => {
    const fit = fitArt(1600, 900, ART_W, ART_H, "contain");
    expect(fit.scale).toBeCloseTo(900 / 1024, 12);
    expect(fit.offsetX).toBeGreaterThan(0);
    expect(fit.offsetY).toBeCloseTo(0, 12);
  });

  it("never crops: every art corner lands inside the box", () => {
    const fit = fitArt(1000, 700, ART_W, ART_H, "contain");
    for (const [x, y] of [
      [0, 0],
      [ART_W, 0],
      [ART_W, ART_H],
      [0, ART_H],
    ]) {
      const [bx, by] = artToBox(fit, x!, y!);
      expect(bx).toBeGreaterThanOrEqual(-1e-9);
      expect(by).toBeGreaterThanOrEqual(-1e-9);
      expect(bx).toBeLessThanOrEqual(1000 + 1e-9);
      expect(by).toBeLessThanOrEqual(700 + 1e-9);
    }
  });
});

describe("fitArt — degenerate boxes", () => {
  it("returns scale 0 rather than NaN or Infinity before layout has a size", () => {
    // jsdom always reports 0x0, and a real ResizeObserver reports it for the first frame.
    for (const [w, h] of [
      [0, 0],
      [0, 900],
      [1600, 0],
      [-10, 900],
      [Number.NaN, 900],
      [Number.POSITIVE_INFINITY, 900],
    ]) {
      expect(fitArt(w!, h!, ART_W, ART_H)).toEqual({ scale: 0, offsetX: 0, offsetY: 0 });
    }
  });

  it("returns scale 0 for degenerate art dimensions", () => {
    expect(fitArt(1600, 900, 0, 1024)).toEqual({ scale: 0, offsetX: 0, offsetY: 0 });
    expect(fitArt(1600, 900, 1536, 0)).toEqual({ scale: 0, offsetX: 0, offsetY: 0 });
  });
});

describe("artToBox", () => {
  it("places the art centre at the box centre under either mode", () => {
    for (const mode of ["cover", "contain"] as const) {
      const fit = fitArt(1600, 900, ART_W, ART_H, mode);
      const [cx, cy] = artToBox(fit, ART_W / 2, ART_H / 2);
      expect(cx).toBeCloseTo(800, 9);
      expect(cy).toBeCloseTo(450, 9);
    }
  });
});

describe("svgPreserveAspectRatio", () => {
  it("pairs cover with slice and contain with meet", () => {
    expect(svgPreserveAspectRatio("cover")).toBe("xMidYMid slice");
    expect(svgPreserveAspectRatio("contain")).toBe("xMidYMid meet");
  });
});

describe("fitTransform", () => {
  it("translates in untransformed box pixels, then scales", () => {
    // Order matters: `scale(...) translate(...)` would multiply the offset by the scale a second
    // time and slide the whole room off the painting.
    const fit = fitArt(1600, 900, ART_W, ART_H);
    expect(fitTransform(fit)).toBe(
      `translate(${fit.offsetX}px, ${fit.offsetY}px) scale(${fit.scale})`,
    );
    expect(fitTransform(fit).indexOf("translate")).toBeLessThan(fitTransform(fit).indexOf("scale"));
  });

  it("composes with an art-pixel point to the same place artToBox reports", () => {
    // The transform and artToBox are two spellings of one rule; if they diverge, previews land
    // somewhere the polygons are not.
    const fit = fitArt(1330, 748, ART_W, ART_H);
    const [x, y] = [821, 243];
    const [bx, by] = artToBox(fit, x, y);
    expect(bx).toBeCloseTo(fit.offsetX + x * fit.scale, 12);
    expect(by).toBeCloseTo(fit.offsetY + y * fit.scale, 12);
  });
});
