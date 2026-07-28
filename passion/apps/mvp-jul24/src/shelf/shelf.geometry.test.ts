/**
 * The shelf polygons, held to the same standard as the gadget props.
 *
 * WHY THESE LIVE HERE AND NOT IN `quads.data.test.ts`
 * The shelf is a separate field on the room precisely so that the gadget-coverage invariant in that
 * file stays exactly as strong as it was (see `ShelfProp`). The cost of that choice is that the shelf
 * would otherwise escape the polygon assertions that file makes over `room.props` — so they are made
 * again here, over `room.shelf`, plus one the props do not need: that the shelf does not overlap them.
 */

import { describe, expect, it } from "vitest";
import {
  bounds,
  containsPoint,
  isClockwise,
  signedArea,
  type Polygon,
} from "../cabin/backdrop/geometry";
import { ART_HEIGHT, ART_WIDTH, BACKDROP_ROOMS } from "../cabin/backdrop/quads.data";
import { propPolygon } from "../cabin/backdrop/types";

const SHELVES = BACKDROP_ROOMS.flatMap((room) =>
  room.shelf ? [{ room, shelf: room.shelf, name: `${room.topic}/shelf` }] : [],
);

const centroid = (polygon: Polygon): [number, number] => [
  polygon.reduce((sum, [x]) => sum + x, 0) / polygon.length,
  polygon.reduce((sum, [, y]) => sum + y, 0) / polygon.length,
];

describe("authored shelves", () => {
  it("exists in all three built rooms (otherwise everything below is vacuous)", () => {
    expect(SHELVES.map((s) => s.room.topic)).toEqual(["logic-games", "math", "music"]);
  });

  it("gives every shelf a non-empty accessible name", () => {
    for (const { shelf, name } of SHELVES) {
      expect(shelf.label.trim().length, name).toBeGreaterThan(2);
    }
  });

  it("winds clockwise on screen with real area", () => {
    for (const { shelf, name } of SHELVES) {
      expect(signedArea(shelf.outline), `${name} signed area`).toBeGreaterThan(0);
      expect(isClockwise(shelf.outline, 400), `${name} winding + minimum area`).toBe(true);
    }
  });

  it("stays inside the art's bounds", () => {
    for (const { shelf, name } of SHELVES) {
      const box = bounds(shelf.outline);
      expect(box.x, `${name} left`).toBeGreaterThanOrEqual(0);
      expect(box.y, `${name} top`).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width, `${name} right`).toBeLessThanOrEqual(ART_WIDTH);
      expect(box.y + box.height, `${name} bottom`).toBeLessThanOrEqual(ART_HEIGHT);
    }
  });

  it("uses integer art pixels", () => {
    // Sub-pixel authoring would imply a precision the measuring method does not have and would make
    // the numbers harder to re-check against a crop.
    for (const { shelf, name } of SHELVES) {
      for (const [x, y] of shelf.outline) {
        expect(Number.isInteger(x), `${name} x=${x}`).toBe(true);
        expect(Number.isInteger(y), `${name} y=${y}`).toBe(true);
      }
    }
  });

  it("has no duplicated consecutive points", () => {
    for (const { shelf, name } of SHELVES) {
      const outline = shelf.outline;
      for (let i = 0; i < outline.length; i++) {
        const a = outline[i]!;
        const b = outline[(i + 1) % outline.length]!;
        expect(a[0] === b[0] && a[1] === b[1], `${name} point ${i}`).toBe(false);
      }
    }
  });

  it("traces more than four points, because every painted shelf has a stepped silhouette", () => {
    // A four-point shelf would mean someone drew a rectangle over the case's front and called it a
    // silhouette. Logic Games has an overhanging cornice and a table across its foot; Math has an
    // armchair in front of it. Neither is a quad, and the outlines say so.
    for (const { shelf, name } of SHELVES) {
      expect(shelf.outline.length, name).toBeGreaterThan(4);
    }
  });

  it("is genuinely non-rectangular: at least one bounding-box corner is outside it", () => {
    for (const { shelf, name } of SHELVES) {
      const box = bounds(shelf.outline);
      const corners: Array<[number, number]> = [
        [box.x + 1, box.y + 1],
        [box.x + box.width - 1, box.y + 1],
        [box.x + box.width - 1, box.y + box.height - 1],
        [box.x + 1, box.y + box.height - 1],
      ];
      const outside = corners.filter((corner) => !containsPoint(shelf.outline, corner));
      expect(outside.length, `${name} corners outside`).toBeGreaterThan(0);
    }
  });

  it("contains its own centroid, so the hit region is where it looks", () => {
    for (const { shelf, name } of SHELVES) {
      expect(containsPoint(shelf.outline, centroid(shelf.outline)), name).toBe(true);
    }
  });

  it("does not overlap any gadget prop", () => {
    // Overlapping hotspots swallow each other's clicks by DOM order, and the shelf's layer is mounted
    // ABOVE the props — so an overlap here would silently steal a puzzle's clicks rather than its
    // own. Checked both ways round, at each polygon's centroid, exactly as quads.data.test.ts does
    // between props. The Logic Games shelf is the one this constrains: the chess set's outline rises
    // to y=697 under it, which is why the shelf's foot stops at y=686.
    for (const { room, shelf, name } of SHELVES) {
      const shelfCentre = centroid(shelf.outline);
      for (const prop of room.props) {
        const polygon = propPolygon(prop);
        expect(containsPoint(polygon, shelfCentre), `${name} centre inside ${prop.gadgetId}`).toBe(
          false,
        );
        expect(
          containsPoint(shelf.outline, centroid(polygon)),
          `${prop.gadgetId} centre inside ${name}`,
        ).toBe(false);
      }
    }
  });

  it("is big enough to be an obvious target at a real window size", () => {
    // The backdrop is 1536 art px wide and typically drawn 900-1400 CSS px wide, so an art pixel is
    // roughly 0.6-0.9 CSS px. 150x150 art px is the floor for something a child is supposed to
    // notice is clickable at all.
    for (const { shelf, name } of SHELVES) {
      const box = bounds(shelf.outline);
      expect(box.width, `${name} width`).toBeGreaterThanOrEqual(150);
      expect(box.height, `${name} height`).toBeGreaterThanOrEqual(150);
    }
  });
});
