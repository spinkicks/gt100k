import { describe, expect, it } from "vitest";
import { hashSeed, parseParams } from "../cabin/src/core/params";
import {
  type RasterImage,
  gateFireEmissive,
  gateNoCrushedBlacks,
  gateNoFlatFace,
} from "../tools/gates";

/** Build a solid-color raster for gate math tests. */
function solid(r: number, g: number, b: number, w = 64, h = 64): RasterImage {
  const data = Buffer.alloc(w * h * 3);
  for (let i = 0; i < data.length; i += 3) {
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }
  return { data, width: w, height: h, channels: 3 };
}

describe("params", () => {
  it("hashSeed is deterministic and stable across calls", () => {
    expect(hashSeed("1337")).toBe(hashSeed("1337"));
    expect(hashSeed(42)).toBe(hashSeed("42"));
  });

  it("parses a full cam pose", () => {
    const p = parseParams("?seed=1337&cam=1,2,3,0.5,-0.1,66&freeze=1");
    expect(p.cam).toEqual({ x: 1, y: 2, z: 3, yaw: 0.5, pitch: -0.1, fov: 66 });
    expect(p.freeze).toBe(true);
  });

  it("defaults fov and rejects malformed cam", () => {
    expect(parseParams("?cam=1,2,3,0.5,-0.1").cam?.fov).toBe(60);
    expect(parseParams("?cam=nope").cam).toBeNull();
  });
});

describe("gates", () => {
  it("no-crushed-blacks fails on a pure-black frame, passes on a lit one", () => {
    expect(gateNoCrushedBlacks(solid(0, 0, 0)).pass).toBe(false);
    expect(gateNoCrushedBlacks(solid(90, 70, 50)).pass).toBe(true);
  });

  it("fire-emissive detects a warm-bright region", () => {
    const img = solid(20, 18, 16); // dark room
    // paint a warm-bright block (fire) into the lower-centre
    for (let y = 40; y < 56; y++)
      for (let x = 24; x < 40; x++) {
        const i = (y * img.width + x) * 3;
        img.data[i] = 240;
        img.data[i + 1] = 150;
        img.data[i + 2] = 60;
      }
    expect(gateFireEmissive(img).pass).toBe(true);
    expect(gateFireEmissive(solid(20, 18, 16)).pass).toBe(false);
  });

  it("no-flat-face fails a single flat color", () => {
    expect(gateNoFlatFace(solid(120, 80, 40)).pass).toBe(false);
  });
});
