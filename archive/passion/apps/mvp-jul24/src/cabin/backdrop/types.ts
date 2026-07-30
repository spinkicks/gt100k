/**
 * The shape of a still-backdrop room. Types only — every coordinate lives in `quads.data.ts`, which
 * is the one file that has to be re-authored when the art is regenerated.
 */

import type { TopicId } from "../../game/types";
import type { FirelightRegions, ShaftRegion } from "../aliveness/regions";
import type { Polygon, Quad } from "./geometry";

/**
 * Whether a prop's outline is a plane we can project onto, or just a silhouette to click.
 *
 * `flat` — a wall board, a table top, a rug: something whose painted surface is a plane. Exactly
 * four points, and they double as a homography target, so a live puzzle preview can be warped into
 * them and read as lying on that surface.
 *
 * `object` — a chess set with pieces standing up, a lamp, an animal: a silhouette with no single
 * plane. Any number of points, hit testing only. Attempting a warp here would produce a preview
 * skewed across whatever plane happened to best-fit the outline, which looks worse than no preview.
 *
 * The distinction is enforced in the type system below (`Quad` vs `Polygon`) rather than validated
 * at runtime, so a `flat` prop with five points does not compile.
 */
export type PropKind = "flat" | "object";

interface PropBase {
  /**
   * The gadget this prop opens, from `gadgets/registry.ts`. Activation calls the existing
   * `focusGadget` action, exactly as the 3D and static backends do — the backdrop adds a new way to
   * reach a gadget, not a new kind of thing to reach.
   */
  gadgetId: string;
  /**
   * The prop's accessible name — what it is in the painting, not what it opens. "Nonogram board on
   * the wall", not "Open Nonogram": a screen-reader user should be able to build the same mental
   * picture of the room a sighted player gets, and the role already says it is actionable.
   */
  label: string;
}

export interface FlatProp extends PropBase {
  kind: "flat";
  /** Top-left, top-right, bottom-right, bottom-left of the painted plane. See `Quad`. */
  quad: Quad;
}

export interface ObjectProp extends PropBase {
  kind: "object";
  /** N-point silhouette, wound clockwise on screen. */
  outline: Polygon;
}

export type BackdropProp = FlatProp | ObjectProp;

/**
 * The bookshelf: a clickable silhouette in the painting that is **not gadget-backed**.
 *
 * WHY IT IS ITS OWN FIELD ON THE ROOM AND NOT AN ENTRY IN `props`
 * `quads.data.test.ts` asserts that a room's props cover every gadget in its topic *exactly once,
 * with none for absent gadgets*. That invariant is load-bearing — it is what stops a puzzle shipping
 * with no painted surface to click — so the bookshelf must not be allowed to dilute it. Three ways
 * were considered:
 *
 *   1. Give the shelf a `gadgets/registry.ts` entry. Rejected, and not on style grounds: `CabinView`
 *      calls `sessionLog.recordSurfaced` for every gadget in the topic, so a registry entry would
 *      enter the shelf into the interest/skip pipeline as an activity the child declined. That
 *      pollutes the exact signals the shelf exists to support (see PROJECT.md, D5) with a row about
 *      a piece of furniture. `GadgetOverlay` would also try to render a puzzle for it.
 *   2. Add a `kind: "shelf"` member to `BackdropProp` and filter it out of the coverage check.
 *      Honest, but it weakens the assertion's text for the sake of one non-gadget, and every
 *      consumer of `BackdropProp` then has to branch on a `gadgetId` that may not be there.
 *   3. THIS. A separate, optional field with no `gadgetId` at all. The coverage invariant is
 *      untouched and unweakened, the type system makes "shelf with a gadgetId" and "gadget with no
 *      prop" both unrepresentable, and the shelf's own polygon invariants are asserted in
 *      `src/shelf/shelf.geometry.test.ts` — the same winding, bounds, integer-pixel and
 *      non-rectangularity checks the gadget props get, plus one that it does not overlap them.
 *
 * It is an `object` silhouette in all but name (`kind` would carry no information here, since a
 * shelf never receives a warped preview): both painted shelves are partly occluded — by the chess
 * table in Logic Games, by the leather chair in Math — so their outlines follow what is visible
 * rather than the case's flat front, and neither is a quad.
 */
export interface ShelfProp {
  /** N-point silhouette of the *visible* shelf, wound clockwise on screen. */
  outline: Polygon;
  /**
   * The shelf's accessible name — what it is in the painting, same rule as `PropBase.label`. The
   * cards it holds are named by the panel it opens, not here.
   */
  label: string;
}

/**
 * Where the light in a room's painting is, so the still can be animated over it.
 *
 * These are the props `CabinAliveness` takes, in the same units as everything else here: the art's
 * own pixel space, TL/TR/BR/BL winding (see `aliveness/regions.ts`, which owns the contract). The
 * two modules were written independently and agree on that space exactly, so this is a re-export of
 * their types rather than a translation of them — a translation is the thing most likely to drift.
 *
 * OPTIONAL, PER ROOM, AND OPTIONAL PER EFFECT INSIDE THAT. A room whose plate has not been measured
 * omits `aliveness` and renders the still exactly as before; a room with a fire but no window omits
 * `shaft`. Regions traced onto the wrong painting are worse than no effect at all — a glow floating
 * on a bare wall reads as a rendering bug, where a still room only reads as still.
 */
export interface RoomAliveness {
  /** Fireplace / lantern emitters. Omit for a room with no visible fire. */
  firelight?: FirelightRegions | null;
  /** The window light shaft the dust motes drift inside. Omit for a room with no visible shaft. */
  shaft?: ShaftRegion | null;
}

export interface BackdropRoom {
  topic: TopicId;
  /**
   * Candidate backdrop URLs, tried in order until one loads. See the note in `quads.data.ts` about
   * why there is more than one during the art-regeneration window.
   */
  sources: readonly string[];
  /** The art's own pixel dimensions — the SVG overlay's viewBox and the unit of every coordinate. */
  artWidth: number;
  artHeight: number;
  props: readonly BackdropProp[];
  /**
   * The painted bookshelf, if this plate has one. Absent = no shelf hotspot is rendered at all,
   * which is the only honest state for a room whose painting contains no shelf — see `ShelfProp`.
   */
  shelf?: ShelfProp;
  /** Measured light in this room's plate. Absent = the still is shown without effects. */
  aliveness?: RoomAliveness;
}

/** The polygon of either prop kind, for code that only cares about hit testing. */
export function propPolygon(prop: BackdropProp): Polygon {
  return prop.kind === "flat" ? prop.quad : prop.outline;
}
