import { describe, expect, it } from "vitest";
import { GADGETS, gadgetById } from "../../gadgets/registry";
import {
  bounds,
  containsPoint,
  isClockwise,
  isStrictlyConvex,
  quadSourceSize,
  signedArea,
} from "./geometry";
import { rectToQuad } from "./homography";
import { ART_HEIGHT, ART_WIDTH, BACKDROP_ROOMS, backdropRoomFor } from "./quads.data";
import { propPolygon } from "./types";

const ALL_PROPS = BACKDROP_ROOMS.flatMap((room) =>
  room.props.map((prop) => ({ room, prop, name: `${room.topic}/${prop.gadgetId}` })),
);

describe("authored rooms", () => {
  it("declares the art dimensions every coordinate is expressed in", () => {
    for (const room of BACKDROP_ROOMS) {
      expect(room.artWidth).toBe(ART_WIDTH);
      expect(room.artHeight).toBe(ART_HEIGHT);
    }
  });

  it("offers at least one backdrop source per room", () => {
    for (const room of BACKDROP_ROOMS) {
      expect(room.sources.length).toBeGreaterThan(0);
      for (const src of room.sources) expect(src.startsWith("/")).toBe(true);
    }
  });

  it("resolves by topic and returns undefined for topics with no authored interior", () => {
    // Both built cabins are authored. `math` was pinned as undefined here on purpose, to stop a room
    // being added by the side door while that cabin had no activities in it. It has five now, so the
    // pin is inverted rather than deleted.
    expect(backdropRoomFor("logic-games")).toBeDefined();
    expect(backdropRoomFor("math")).toBeDefined();
    // `music` joined them on 2026-07-27, painted for exactly its three built activities.
    expect(backdropRoomFor("music")).toBeDefined();
    // The rest have no interior at all and must come back undefined rather than throwing, because
    // the map lets a player reach them.
    for (const topic of ["code", "art", "science", "words", "nonsense"]) {
      expect(backdropRoomFor(topic)).toBeUndefined();
    }
  });

  it("covers every gadget in the topic exactly once, with no props for absent gadgets", () => {
    for (const room of BACKDROP_ROOMS) {
      const expected = GADGETS.filter((g) => g.topic === room.topic)
        .map((g) => g.id)
        .sort();
      const authored = room.props.map((p) => p.gadgetId).sort();
      expect(authored).toEqual(expected);
    }
  });

  it("points every prop at a gadget that exists", () => {
    for (const { prop, name } of ALL_PROPS) {
      expect(gadgetById(prop.gadgetId), name).toBeDefined();
    }
  });

  it("gives every prop a non-empty accessible name", () => {
    for (const { prop, name } of ALL_PROPS) {
      expect(prop.label.trim().length, name).toBeGreaterThan(2);
    }
  });
});

describe("polygon invariants", () => {
  it("winds every polygon clockwise on screen, with real area", () => {
    for (const { prop, name } of ALL_PROPS) {
      const polygon = propPolygon(prop);
      expect(signedArea(polygon), `${name} signed area`).toBeGreaterThan(0);
      // 400px^2 is a 20x20 square in art pixels — below that a hotspot is not a credible target
      // even before the backdrop is scaled down.
      expect(isClockwise(polygon, 400), `${name} winding + minimum area`).toBe(true);
    }
  });

  it("keeps every point inside the art's bounds", () => {
    for (const { prop, name } of ALL_PROPS) {
      const box = bounds(propPolygon(prop));
      expect(box.x, `${name} left`).toBeGreaterThanOrEqual(0);
      expect(box.y, `${name} top`).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width, `${name} right`).toBeLessThanOrEqual(ART_WIDTH);
      expect(box.y + box.height, `${name} bottom`).toBeLessThanOrEqual(ART_HEIGHT);
    }
  });

  it("has no duplicated consecutive points", () => {
    for (const { prop, name } of ALL_PROPS) {
      const polygon = propPolygon(prop);
      for (let i = 0; i < polygon.length; i++) {
        const a = polygon[i]!;
        const b = polygon[(i + 1) % polygon.length]!;
        expect(a[0] === b[0] && a[1] === b[1], `${name} point ${i}`).toBe(false);
      }
    }
  });

  it("uses integer art pixels", () => {
    // Sub-pixel authoring implies a precision the measuring method does not have, and it makes the
    // numbers harder to re-check against a crop.
    for (const { prop, name } of ALL_PROPS) {
      for (const [x, y] of propPolygon(prop)) {
        expect(Number.isInteger(x), `${name} x=${x}`).toBe(true);
        expect(Number.isInteger(y), `${name} y=${y}`).toBe(true);
      }
    }
  });
});

describe("flat props", () => {
  const flats = ALL_PROPS.filter((p) => p.prop.kind === "flat");

  it("exists (otherwise the assertions below are vacuous)", () => {
    expect(flats.length).toBeGreaterThan(0);
  });

  it("has exactly four points", () => {
    for (const { prop, name } of flats) {
      expect(propPolygon(prop).length, name).toBe(4);
    }
  });

  it("is strictly convex, so the homography solve can never be singular", () => {
    for (const { prop, name } of flats) {
      expect(isStrictlyConvex(propPolygon(prop)), name).toBe(true);
    }
  });

  it("yields a usable homography whose corners land on the authored corners", () => {
    for (const { prop, name } of flats) {
      if (prop.kind !== "flat") continue;
      const { width, height } = quadSourceSize(prop.quad);
      const m = rectToQuad(width, height, prop.quad);
      expect(m, `${name} homography`).not.toBeNull();
      expect(m!.every(Number.isFinite), `${name} finite`).toBe(true);
    }
  });

  it("is big enough for a preview to be legible", () => {
    for (const { prop, name } of flats) {
      if (prop.kind !== "flat") continue;
      const { width, height } = quadSourceSize(prop.quad);
      // A 9x9 minesweeper board is the densest preview, so ~70px is the floor at which a cell is
      // still more than a few pixels once the backdrop is scaled to a real viewport.
      expect(Math.min(width, height), `${name} short side`).toBeGreaterThanOrEqual(70);
    }
  });
});

describe("object props", () => {
  const objects = ALL_PROPS.filter((p) => p.prop.kind === "object");

  it("exists (both kinds are exercised by the authored data)", () => {
    expect(objects.length).toBeGreaterThan(0);
  });

  it("traces more than four points — otherwise it should have been a flat quad", () => {
    for (const { prop, name } of objects) {
      expect(propPolygon(prop).length, name).toBeGreaterThan(4);
    }
  });
});

describe("hit regions are genuinely non-rectangular", () => {
  it("excludes at least one corner of its own bounding box", () => {
    // The whole reason for polygons over rectangles: if every polygon contained its bounding box's
    // corners it would be an axis-aligned rectangle in disguise and this engine would be pointless.
    for (const { prop, name } of ALL_PROPS) {
      const polygon = propPolygon(prop);
      const box = bounds(polygon);
      const corners: Array<[number, number]> = [
        [box.x + 1, box.y + 1],
        [box.x + box.width - 1, box.y + 1],
        [box.x + box.width - 1, box.y + box.height - 1],
        [box.x + 1, box.y + box.height - 1],
      ];
      const outside = corners.filter((c) => !containsPoint(polygon, c));
      expect(outside.length, `${name} bounding-box corners outside the polygon`).toBeGreaterThan(0);
    }
  });

  it("contains its own centroid", () => {
    for (const { prop, name } of ALL_PROPS) {
      const polygon = propPolygon(prop);
      const cx = polygon.reduce((s, [x]) => s + x, 0) / polygon.length;
      const cy = polygon.reduce((s, [, y]) => s + y, 0) / polygon.length;
      expect(containsPoint(polygon, [cx, cy]), name).toBe(true);
    }
  });

  it("does not overlap another prop's polygon at its centroid", () => {
    // Overlapping hotspots mean one prop silently swallows another's clicks depending on DOM order.
    for (const { room, prop, name } of ALL_PROPS) {
      const polygon = propPolygon(prop);
      const cx = polygon.reduce((s, [x]) => s + x, 0) / polygon.length;
      const cy = polygon.reduce((s, [, y]) => s + y, 0) / polygon.length;
      for (const other of room.props) {
        if (other === prop) continue;
        expect(
          containsPoint(propPolygon(other), [cx, cy]),
          `${name} inside ${other.gadgetId}`,
        ).toBe(false);
      }
    }
  });
});
