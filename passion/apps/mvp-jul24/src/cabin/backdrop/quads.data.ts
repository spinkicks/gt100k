/* ===========================================================================================
 * PLACEHOLDER COORDINATES — PENDING FINAL ART. EXPECT TO REPLACE EVERY NUMBER IN THIS FILE.
 * ===========================================================================================
 *
 * SCOPE OF THAT BANNER: the LOGIC GAMES room only. It is measured against a gitignored concept
 * frame that the art pipeline is still regenerating (below). The MATH room further down is
 * measured against `public/art/cabin-backdrop-math.png` — a committed, shipping asset — so its
 * numbers are as stable as that file is, and it carries its own provenance block rather than
 * inheriting this one.
 *
 * This is the ONLY file in `cabin/backdrop/` that contains coordinates. Everything else — the
 * homography, the fit rule, the polygon overlay, the previews — is written against whatever is in
 * here, so re-authoring a room after the art changes means editing this file and nothing else.
 * Keep it that way: if you find yourself wanting a pixel value in a component, it belongs here.
 *
 * WHAT THE LOGIC GAMES NUMBERS WERE MEASURED AGAINST
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
import type { BackdropRoom, RoomAliveness, ShelfProp } from "./types";

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
/**
 * The bookshelf on the left wall, below the framed grid board.
 *
 * ===========================================================================================
 * MEASURED AGAINST `public/art/cabin-backdrop-logic-games.png`, 1536x1024 (the committed plate,
 * NOT the concept still the props above were traced onto).
 * ===========================================================================================
 * Not a gadget — see `ShelfProp` in types.ts for why it is a separate field rather than a sixth
 * prop, and PROJECT.md ("The shelf is the D5 maintenance path") for why it exists at all.
 *
 * HOW IT WAS MEASURED
 * A 50px labelled grid was burned over the plate (`scripts/art-inspect.mjs grid`), the shelf region
 * cropped and upscaled 3-6x, and then — because this shelf sits in the darkest part of a
 * warm-graded room, where an eyeballed edge is worth about ten pixels — each edge was read off a
 * numeric luminance profile across it rather than off the crop. The finished polygon was drawn back
 * over the full plate and inspected, which is the check that catches "numerically defensible,
 * visibly wrong".
 *
 * WHAT THE PROFILES SAID
 *  - TOP: the cornice's upper edge is a shallow step running y=487 at x=10 to y=481 at x=400 — it
 *    rises slightly to the right, where the nonogram frame above it falls to the right. The plate's
 *    perspective is not internally consistent (already noted for the pegboard and tangram panel
 *    above); tracing what is painted still beats imposing a vanishing point the art does not have.
 *  - The cornice OVERHANGS the case: the dark band ends at x=392 (bright lit wall from x=393 at both
 *    y=490 and y=494), while the case's right stile is a lit vertical face at x=360..368 with wall
 *    beyond it from x=371, at y=505, 620 and 690 alike. Hence the two-step corner at the top right:
 *    (392,482)-(392,493)-(370,497). A bounding box would have claimed 22px of lit wall for 200px.
 *  - LEFT: the shelf runs off-frame, so x=0 is the boundary. There is a dark stile at x=28..31 with
 *    only shadow to its left, but the cornice and the shelf boards continue to the frame edge, so
 *    cutting the polygon at the stile would give up real shelf to avoid a dim corner.
 *  - BOTTOM: the round table occludes the lower shelves; its rim crosses y=725 at x=48 and y=709 at
 *    x=196. The polygon stops ABOVE that at (0,698)-(370,686), for a reason beyond neatness: the
 *    chess prop's outline rises to y=697 between x=196 and x=262, and hotspots that overlap swallow
 *    each other's clicks by DOM order. Books are still painted below this line at x>250; they are
 *    given up deliberately.
 */
const LOGIC_GAMES_SHELF: ShelfProp = {
  label: "Bookshelf under the grid board",
  outline: [
    [0, 487],
    [392, 482],
    [392, 493],
    [370, 497],
    [370, 686],
    [0, 698],
  ],
};

const LOGIC_GAMES: BackdropRoom = {
  topic: "logic-games",
  sources: LOGIC_GAMES_SOURCES,
  artWidth: ART_WIDTH,
  artHeight: ART_HEIGHT,
  aliveness: LOGIC_GAMES_ALIVENESS,
  shelf: LOGIC_GAMES_SHELF,
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
 * `logic-games` and `math` are both authored. `music` / `code` / `art` are map-level "coming soon"
 * buttons with no interior at all, so callers must still handle "no room for this topic" —
 * `CabinBackdrop` does, and `CabinView` falls back to the static backend for exactly that case.
 *
 * That fallback is why authoring `math` mattered rather than being cosmetic. `backdrop` is the
 * default backend now, and a topic without a room here renders `static` instead: a room whose
 * activities stay reachable, but visibly plainer than an authored one. Until this room existed, the
 * math cabin was that room.
 */

/**
 * ===========================================================================================
 * THE MATH ROOM
 * ===========================================================================================
 *
 * Measured against `public/art/cabin-backdrop-math.png`, 1536x1024 — a **committed, shipping
 * asset**, not a gitignored concept still. So the placeholder banner at the top of this file does
 * not apply to anything below here: these numbers are exactly as stable as that PNG is.
 *
 * No new art was generated for this room. Every one of the five maths activities already had an
 * object painted in the plate, and the mapping below is the one recorded in PROJECT.md — it was
 * decided by reading the painting, not by choosing what would be convenient to trace.
 *
 * WHY FOUR OF THE FIVE ARE `object` AND ONE IS `flat`
 * `flat` means the object presents a genuine flat face in perspective, which is what makes a
 * 4-point homography meaningful. Brass gears, a balance, glass tubes and a prism do not: they are
 * dimensional things whose silhouette is not a quadrilateral, so forcing a quad onto them would
 * give a hit area that covers wall instead of object. Only the instrument cabinet has a real flat
 * front face. Note that no puzzle preview is composited onto any of these — previews are off by
 * default (see `CabinBackdrop`'s `previews` prop) and these props are decorative — so `flat` buys
 * nothing here except a tighter fit where the painting actually supports one.
 *
 * HOW THESE WERE MEASURED
 * A 50px grid with 200px majors was burned over the plate, each prop region cropped and upscaled
 * 3x, and the coordinates read off the grid rather than estimated. The outlines trace each object's
 * silhouette, because hit areas that follow the object rather than its bounding box are an explicit
 * requirement, not a nicety.
 */
const MATH_SOURCES = ["/art/cabin-backdrop-math.png"] as const;

/**
 * Light in the math plate. Unlike Logic Games this room has a **lit wall sconce** as well as a
 * hearth and a shaft, so it is the only room so far that uses all four emitters.
 *
 *  - Hearth: the firebox sits at (592, 618) with the arch topping out near y=520.
 *  - Floor pool: the warm patch thrown forward onto the rug, in front of the hearth.
 *  - Sconce: the small lit lamp on the right-hand wall at (1045, 335) — genuinely emitting in the
 *    painting, so it gets its own flicker stream rather than breathing in sync with the fire.
 *  - Shaft: the haze from the right-hand window, sloping down and to the left across the room.
 *
 * The tint is the same warm white as Logic Games and for the same reason: this interior is
 * warm-graded end to end, so the module's cool-daylight default would make the motes the only cold
 * pixels in the room.
 */
const MATH_ALIVENESS: RoomAliveness = {
  firelight: {
    core: { x: 592, y: 618, w: 240, h: 260 },
    floor: { x: 600, y: 762, w: 450, h: 200 },
    bounce: { x: 660, y: 600, w: 2200, h: 1800 },
    sconce: { x: 1045, y: 335, w: 150, h: 150 },
  },
  shaft: shaftFromQuad(
    [
      [1105, 335],
      [1290, 372],
      [1058, 748],
      [888, 662],
    ],
    [255, 240, 214],
  ),
};

/**
 * The tall bookshelf on the left wall. Same measuring method as the Logic Games shelf above, same
 * plate this room's props were measured against, and the same reason for existing.
 *
 * WHAT THE PROFILES SAID
 *  - TOP: the lit front edge of the top board steps to shadow at y=205 (x=60), 214 (x=160) and 223
 *    (x=260) — a clean 0.09 px/px fall to the right, which is this wall receding. The band's upper
 *    edge is ~18px above that, giving (0,181) to (319,213).
 *  - RIGHT: the right stile is a lit vertical face at x=311..318 with a dark gap at x=307..310 in
 *    front of it and wall from x=319, and it reads the SAME at y=300, 450 and 560. So unlike the
 *    Logic Games shelf this edge is genuinely vertical in the painting, not foreshortened, and the
 *    polygon says so rather than inventing a taper for consistency's sake.
 *  - BOTTOM: the leather armchair occludes the lower half. Its back rises from (40,516) across a
 *    crown at (175,500) and falls away to the arm at (284,614), so the polygon's underside is that
 *    silhouette, traced off a 4x crop. The strip of shelf still visible to the LEFT of the chair
 *    (x<40, below y=522) is given up: it is ~36px wide, in deep shadow, and adding it would put a
 *    thin tail on the hit region for no click anyone would make.
 *  - Nothing here can collide with this room's five props; all of them are at x>=470.
 */
const MATH_SHELF: ShelfProp = {
  label: "Tall bookshelf on the left wall",
  outline: [
    [0, 181],
    [319, 213],
    [319, 606],
    [284, 614],
    [270, 590],
    [249, 544],
    [225, 507],
    [175, 500],
    [124, 502],
    [40, 516],
    [0, 522],
  ],
};

const MATH: BackdropRoom = {
  topic: "math",
  sources: MATH_SOURCES,
  artWidth: ART_WIDTH,
  artHeight: ART_HEIGHT,
  aliveness: MATH_ALIVENESS,
  shelf: MATH_SHELF,
  props: [
    {
      // The brass gear cluster on the chimney breast. Traced around the gears themselves and NOT
      // around the linkage frame to their right: a polygon spanning both would swallow the bare
      // stone between them, and the gears alone are what reads as "gear train" at a glance.
      kind: "object",
      gadgetId: "gear-train",
      label: "Brass gear train on the chimney breast",
      outline: [
        [470, 285],
        [500, 224],
        [557, 204],
        [601, 249],
        [601, 331],
        [559, 396],
        [499, 381],
        [477, 339],
      ],
    },
    {
      // The brass balance: upright column, dark weighing pan, splayed foot. Left of the vial rack
      // and deliberately not merged with it — they are two instruments on one board, and merging
      // would make one activity's hit area cover another's object.
      kind: "object",
      gadgetId: "balance-scale",
      label: "Brass balance scale",
      // Bottom edge raised to ~y=418 (was ~y=428-430) so it stops just above the function-machine
      // funnel below it: this is a wall-shelf object well above the machine and doesn't need those
      // rows. See the note on `function-machine` for what sharing them used to cost.
      outline: [
        [802, 237],
        [843, 237],
        [847, 350],
        [871, 418],
        [803, 420],
        [795, 350],
      ],
    },
    {
      // The three glass tubes of coloured liquid at visibly different fill levels, in their rack.
      // The fill levels are why this maps to Ratio Mixing rather than to anything else in the room.
      kind: "object",
      gadgetId: "ratio-mixing",
      label: "Rack of coloured vials",
      outline: [
        [876, 272],
        [948, 267],
        [951, 352],
        [949, 401],
        [878, 401],
        [873, 352],
      ],
    },
    {
      // A single upright machine: funnel hopper on top, boxy housing with a round window onto its
      // gearing in the middle, chute out the bottom over a tray. The only prop here with a real
      // flat face, so the only `flat` one. Quad is the front face, not the outer carcass.
      kind: "flat",
      gadgetId: "function-machine",
      label: "Brass function machine",
      // Re-traced 2026-07-26 after the prop was regenerated. It used to be a three-shelf cabinet of
      // scattered brass instruments — the weakest read of the five, closer to a curio cabinet than
      // a machine. It is now one upright machine: funnel hopper on top, a boxy housing with a round
      // window onto its gearing, and a chute angling out at the bottom over a tray, so the
      // in -> transform -> out reading PRD §5.3 wants is legible at prop size.
      //
      // The top edge now runs to y=430-431, up at the funnel's rim, instead of stopping short at
      // y=437-440. It used to stop short because `balance-scale`'s polygon bottom ran to
      // y=428-430, directly over the funnel's visible top — the two quads overlapped, and since
      // overlapping quads swallow each other's clicks by DOM order, clicking the visible top of the
      // hopper opened Balance Scale instead. Fixed by raising `balance-scale`'s bottom edge to
      // ~y=418 (it's a wall-shelf object well above the machine and doesn't need those rows), which
      // freed this quad to extend up to the funnel rim without re-overlapping it.
      quad: [
        [802, 431],
        [931, 430],
        [932, 650],
        [802, 652],
      ],
    },
    {
      // The prism assembly on the low table: the tall glass slab, the pyramid prism beside it, and
      // both brass bases. Traced as one object because the rainbow is thrown between them — the
      // light splitting is the thing, and it is why this maps to Fraction Laser.
      kind: "object",
      gadgetId: "fraction-laser",
      label: "Prism splitting light on the table",
      outline: [
        [1040, 628],
        [1126, 625],
        [1150, 648],
        [1148, 703],
        [1128, 727],
        [1024, 727],
        [1036, 700],
      ],
    },
  ],
};

export const BACKDROP_ROOMS: readonly BackdropRoom[] = [LOGIC_GAMES, MATH];

export function backdropRoomFor(topic: string): BackdropRoom | undefined {
  return BACKDROP_ROOMS.find((room) => room.topic === topic);
}
