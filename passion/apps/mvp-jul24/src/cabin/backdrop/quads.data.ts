/* ===========================================================================================
 * PLACEHOLDER COORDINATES — PENDING FINAL ART. EXPECT TO REPLACE EVERY NUMBER IN THIS FILE.
 * ===========================================================================================
 *
 * This is the ONLY file in `cabin/backdrop/` that contains coordinates. Everything else — the
 * homography, the fit rule, the polygon overlay, the previews — is written against whatever is in
 * here, so re-authoring a room after the art changes means editing this file and nothing else.
 * Keep it that way: if you find yourself wanting a pixel value in a component, it belongs here.
 *
 * WHAT THESE WERE MEASURED AGAINST
 * `shots/concept/concept-logic.png`, 1536x1024 — an AI concept still, generated 2026-07-25 and
 * *gitignored* (see .gitignore: `shots/*`). It is a composition reference, not the shipping asset
 * (PROJECT.md, "Visual direction": concept frames are a dressing reference and never a target).
 * The art pipeline is actively regenerating cabin art, so the painting these quads trace will
 * change and every number below will be wrong. That is expected and fine; the point of shipping
 * them now is that the engine is reviewable against a real image today rather than against nothing.
 *
 * HOW THEY WERE MEASURED
 * Each prop's corners were read off the still with a 20px measuring grid composited over crops of
 * it at 2-3x zoom. Starting positions came from `mockups/ai-path/app.js`, which has hand-measured
 * axis-aligned percentage boxes for this exact image; each box was then converted to pixels and
 * pulled in to the object's actual painted corners, which is where the perspective shows up — the
 * nonogram board's left edge is 234px tall and its right edge 274px, so the axis-aligned box was
 * covering ~15% wall that is not board.
 *
 * FOUR PROPS, BECAUSE THE ROOM HAS FOUR SURFACES
 * This file used to carry seven. Four of them sat on a surface the painting actually gives them —
 * the framed board on the left wall (nonogram), the pipe pegboard and the tangram panel on the back
 * wall (pipes, mirror), and the chess set on the round table — and the other three were parked on
 * borrowed ones: minesweeper on the rug (a real plane, but not a painted board), logic-grid on the
 * stone chimney breast, lits in a 310x78 bookshelf gap that rendered its 6x6 board at ~13 art px a
 * cell. That was never a measuring problem. The concept still does not paint seven puzzle surfaces,
 * and the attempt to make it paint six came back as a wall of identical blank frames.
 *
 * So the roster was cut to four (`src/gadgets/registry.ts` records that decision and its full
 * reasoning; this file only follows it), and the three parked quads were **deleted rather than left
 * commented out**. Unlike the world-space placements in `scene3d/anchors.ts`, which were kept, these
 * numbers are traced onto one specific 1536x1024 painting that is actively being regenerated — they
 * are already provisional and will be wrong the moment the new art lands, so preserving them would
 * preserve nothing but a false sense that a re-add is free. It is not: re-adding a puzzle means
 * finding it a real surface in whatever the art currently is and measuring that surface, which is
 * the same work as authoring any new prop. `git log` has the old numbers if the concept still ever
 * comes back.
 */

import { shaftFromQuad } from "../aliveness/regions";
import type { BackdropRoom, RoomAliveness } from "./types";

/** Source dimensions of every backdrop still. Also the SVG overlay's viewBox. */
export const ART_WIDTH = 1536;
export const ART_HEIGHT = 1024;

/**
 * Backdrop URL candidates, tried in order.
 *
 * 1. `/art/cabin-backdrop-logic-games.png` — where the final still belongs (`public/art/` is the
 *    art pipeline's output directory; see scripts/gen-art.mjs). Not there yet, so this 404s today
 *    and the component moves on to (2). It is first so that the moment the art agent writes that
 *    file, the room switches to it with no code change.
 * 2. `/shots/concept/concept-logic.png` — the concept still these coordinates were measured
 *    against. **Dev-server only**: Vite serves the project root statically in dev, but `vite build`
 *    copies only `public/`, so a built bundle will not find this. That is deliberate — a gitignored
 *    2.6MB concept render has no business in `dist/` — and it means a production build shows the
 *    fallback wash until (1) exists. The polygons and previews work either way.
 */
const LOGIC_GAMES_SOURCES = [
  "/art/cabin-backdrop-logic-games.png",
  "/shots/concept/concept-logic.png",
] as const;

/**
 * Where the light in the Logic Games plate is, for `CabinAliveness`.
 *
 * ===========================================================================================
 * MEASURED AGAINST `public/art/cabin-backdrop-logic-games.png`, 1536x1024, as it stood on
 * 2026-07-25. RE-MEASURE THESE IF THE PLATE'S COMPOSITION CHANGES.
 * ===========================================================================================
 * Unlike the prop quads above — which trace objects the art brief guarantees will exist somewhere
 * in any regeneration — these trace *lighting*, and a regenerated plate can move the fireplace or
 * put the window on the other wall without violating anything anyone asked for. The failure is
 * quiet, too: nothing throws, the room just develops a warm glow on a bare stretch of wall. If you
 * are looking at this file because the art changed, these numbers need a fresh pass over the new
 * plate, and until they get one the honest move is to delete the `aliveness` key from the room
 * below (see `RoomAliveness` — it is optional precisely so that is a one-line retreat).
 *
 * HOW THEY WERE MEASURED
 * Same method as the quads: a 50px labelled grid composited over crops of the plate at 2x, plus a
 * contrast-stretched pass to find the edges of the painted light, which has no hard boundary to
 * read off at normal exposure. Each candidate was then drawn back over the full plate as an outline
 * and eyeballed against the painting, which is the only check that catches "numerically defensible,
 * visibly wrong".
 *
 * WHAT WAS FOUND
 *  - The firebox is at (606, 575) and the arch above it tops out at y=435, so the hot core is a
 *    250x270 ellipse: taller than it is wide, because a fire is.
 *  - The light the fire throws forward lands on the hearthstone and the boards in front of it,
 *    roughly x 410..890 / y 635..855, so the floor pool is a wide, shallow 480x220 ellipse. It is
 *    deliberately not stretched left as far as the chess table: the table is lit in the painting,
 *    but by then the falloff is doing the work and a wider ellipse only washes the near rug out.
 *  - The bounce is 2200x1800, far bigger than the frame, sitting slightly right of the fire because
 *    that is where the room opens up. It is clipped by the layer; that is expected (see regions.ts).
 *  - No sconce. This room's only warm source is the hearth — the lamp-shaped thing on the right is
 *    a chair. A second emitter here would be inventing a light the painting does not have.
 *
 * THE SHAFT is the beam from the window on the right, entering at the lower-left pane and landing
 * on the rug by the cat. It is authored as the same TL/TR/BR/BL tuple the props use and converted
 * by `shaftFromQuad`, so the winding rule is stated once for this file and not twice.
 *
 * Its top-left corner is held down and right of where the painted haze actually starts, clear of
 * the tangram panel. The sheen is a clipped polygon under a 14px blur, which is invisible over the
 * wall boards and distinctly visible as a straight diagonal the moment it crosses something bright
 * with a hard edge — so the quad gives up a little of the beam rather than draw a line across a
 * picture frame. First authored the other way and caught in a browser screenshot, not on the plate.
 *
 * The tint overrides the module default, which is cool daylight (226,240,255). It is wrong here:
 * the plate is warm-graded to the point that *nothing* in the interior has B > R — a cool-light
 * detector run over the whole image lights up the window glass and literally nothing else — so cool
 * motes would be the only cold pixels in the room and would read as snow indoors. (255,240,214) is
 * the warm white the painted haze actually is.
 */
const LOGIC_GAMES_ALIVENESS: RoomAliveness = {
  firelight: {
    core: { x: 606, y: 575, w: 250, h: 270 },
    floor: { x: 650, y: 745, w: 480, h: 220 },
    bounce: { x: 700, y: 560, w: 2200, h: 1800 },
    sconce: null,
  },
  shaft: shaftFromQuad(
    [
      [1085, 455],
      [1300, 470],
      [1035, 890],
      [795, 850],
    ],
    [255, 240, 214],
  ),
};

/**
 * The Logic Games room.
 *
 * Every polygon is wound clockwise on screen starting from the corner that should receive the
 * source rectangle's top-left — see `geometry.ts` for why that winding is mandatory and
 * `quads.data.test.ts` for the assertions that hold this file to it.
 */
const LOGIC_GAMES: BackdropRoom = {
  topic: "logic-games",
  sources: LOGIC_GAMES_SOURCES,
  artWidth: ART_WIDTH,
  artHeight: ART_HEIGHT,
  aliveness: LOGIC_GAMES_ALIVENESS,
  props: [
    {
      // The framed grid board on the left wall — the strongest perspective in the room and the
      // reference case for the whole warp. The quad is the parchment sheet inside the dark frame,
      // not the frame's outer edge, so a composited preview sits on the paper.
      kind: "flat",
      gadgetId: "nonogram",
      label: "Nonogram board on the wall",
      quad: [
        [56, 187],
        [351, 213],
        [347, 447],
        [53, 462],
      ],
    },
    {
      // Pipe pegboard on the back wall, right of the fireplace. Quad is the tan pegboard face
      // inside its frame.
      kind: "flat",
      gadgetId: "pipes",
      label: "Pipe pegboard on the back wall",
      quad: [
        [821, 243],
        [947, 253],
        [946, 453],
        [825, 463],
      ],
    },
    {
      // Carved tangram panel, right of the pegboard. Note this one's top edge rises to the right
      // while the pegboard's falls — the concept still's perspective is not internally consistent,
      // and tracing what is painted beats imposing a vanishing point the art does not have.
      kind: "flat",
      gadgetId: "mirror",
      label: "Mirror tangram panel",
      quad: [
        [992, 293],
        [1095, 283],
        [1093, 426],
        [993, 435],
      ],
    },
    {
      // The chess set on the round table, as an OBJECT rather than a plane: the board is a plane but
      // the pieces stand up off it, so the clickable silhouette has to rise over the back rank.
      // Eight points, traced across the piece tops. No preview is composited here — chess has no
      // preview renderer yet, and a `flat` prop with no preview is a supported state anyway, so the
      // painted set shows through untouched.
      kind: "object",
      gadgetId: "chess",
      label: "Chess set on the table",
      outline: [
        [105, 761],
        [152, 714],
        [196, 697],
        [262, 700],
        [300, 724],
        [352, 736],
        [419, 777],
        [290, 819],
      ],
    },
  ],
};

/**
 * Every authored backdrop room, keyed by topic.
 *
 * Only `logic-games` exists. `math` is a real, deliberately gadget-free room (PROJECT.md,
 * "Structure: two cabins, one split") and there is a `concept-math.png` to trace when someone wants
 * it — but a room with zero gadgets has zero props, so authoring it buys a backdrop image and
 * nothing else. `music` / `code` / `art` are map-level "coming soon" buttons with no interior at
 * all. Callers must therefore handle "no room for this topic"; `CabinBackdrop` does.
 *
 * That absence is what decides the aliveness question for `math`, and it decides it in the
 * direction the effect wants anyway. `public/art/cabin-backdrop-math.png` exists and is perfectly
 * measurable — it has a hearth, a clearly painted shaft from the right-hand window, and (unlike
 * this room) a real lit wall sconce, so it would use all four emitters. But there is no math room
 * here to hang them on, and adding one to carry lighting for a cabin with nothing in it would be
 * authoring a room by the side door: `quads.data.test.ts` pins `backdropRoomFor("math")` as
 * undefined on purpose, and that decision is a product one, not a lighting one. So math renders
 * what it rendered before — the fallback wash, no plate, no effects — and whoever authors the math
 * interior for real measures its light at the same time, with the plate in front of them.
 */
export const BACKDROP_ROOMS: readonly BackdropRoom[] = [LOGIC_GAMES];

export function backdropRoomFor(topic: string): BackdropRoom | undefined {
  return BACKDROP_ROOMS.find((room) => room.topic === topic);
}
