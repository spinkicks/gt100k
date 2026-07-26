import { type KeyboardEvent, type RefObject, useRef, useState } from "react";
import { useGame } from "../../game/store";
import type { TopicId } from "../../game/types";
import CabinAliveness, { type AlivenessEffect } from "../aliveness/CabinAliveness";
import { type FitMode, fitTransform, svgPreserveAspectRatio } from "./fit";
import { quadSourceSize, toSvgPoints } from "./geometry";
import { quadTransform } from "./homography";
import { PreviewFor, usePreviewSnapshot } from "./previews/registry";
import { ART_HEIGHT, ART_WIDTH, backdropRoomFor } from "./quads.data";
import type { BackdropProp, FlatProp } from "./types";
import { propPolygon } from "./types";
import { useFitToElement } from "./useFitToElement";
import "./CabinBackdrop.css";
import "./previews/previews.css";

/**
 * How the art sits in the frame. `cover` — the room bleeds off-frame rather than being letterboxed
 * inside a black bar, which is what a first-person interior wants and what the mockup's "fill" mode
 * settled on. Constant rather than a prop because the SVG overlay and the preview layer both derive
 * from it and they must never disagree; see fit.ts.
 */
const FIT_MODE: FitMode = "cover";

/**
 * ===========================================================================================
 * PREVIEW COMPOSITING IS OFF. THE CODE BELOW IT IS CORRECT AND IS KEPT ON PURPOSE.
 * ===========================================================================================
 *
 * WHAT IS OFF
 * Warping each flat prop's live puzzle board into the painting with a projective `matrix3d`. The
 * whole path — `previews/`, `homography.ts`, the `.cabin-backdrop-props` layer, `useFitToElement`
 * — is intact, imported, and exercised by its own tests on every run. Passing `previews` turns it
 * straight back on with no other change anywhere.
 *
 * WHAT IS NOT OFF, AND MUST NOT BE
 * The perspective quads themselves: non-rectangular hit testing, keyboard focus, and the traced
 * hover/focus outline. Those were reviewed and *wanted*. They are the reason this backend exists
 * and they are unaffected by this flag — read `PropHotspot` below, which does not consult it.
 *
 * WHY IT IS OFF
 * Appearance, reviewed and rejected 2026-07-25. Crisp flat vector on soft warm photoreal loses on
 * three axes at once — colour temperature, edge hardness, grain — and the previews cast no shadow
 * into the scene, so a board reads as a decal held in front of the wall rather than as an object on
 * it. None of that is a defect in the warp; the geometry is right (see below). It is a defect in
 * pairing vector art with a diffusion render, and it is not fixable by nudging the numbers.
 *
 * The puzzles the room shows are instead being **painted into the backdrop art itself**, which
 * solves all three axes for free because there is only one medium left. `refboards/harness.tsx`
 * exports the exact boards that art has to match.
 *
 * WHY IT IS DORMANT RATHER THAN DELETED
 * Because it works. `verify/matrix3d.verify.ts` measures the composited corners against the
 * authored quads in a real browser and gets **0.0000 px** error on every corner of every prop, and
 * `homography.test.ts` / `CabinBackdrop.test.tsx` hold the algebra and the DOM contract. The moment
 * a prop needs to show *live* state — a board a child has actually part-solved, which is the one
 * thing painted art can never do — this is what does it, and re-deriving a projective solve and its
 * degenerate-quad handling from scratch is days of work to recover something already verified.
 * Deleting it would trade a real asset for a slightly shorter file.
 *
 * WHAT WOULD TURN IT BACK ON
 * `<CabinBackdrop topic={...} previews />`. Worth doing when either (a) the painted-in boards need
 * to reflect real per-child state — see the seam described in `previews/snapshots.ts`, which is the
 * other half of that job — or (b) a future backdrop is rendered rather than diffused, so vector
 * over it no longer clashes. It is off by *default* rather than removed from the call site so that
 * flipping it is a one-word edit and so the dormant path cannot rot unnoticed: the tests below
 * render both states.
 */
const PREVIEWS_DEFAULT = false;

/**
 * Still-backdrop cabin backend: one generated painting with clickable perspective polygons over the
 * props in it, and (dormant — see above) live puzzle previews composited onto the flat surfaces.
 *
 * WHY POLYGONS AND NOT THE BOXES THE OTHER BACKENDS USE
 * `CabinStatic` positions each gadget with a percentage point and lets a square button sit there.
 * That works when the "prop" is a little illustrated icon floating over a painting — the button IS
 * the object. It does not work here: the object is *painted into the backdrop* at an angle, so a
 * rectangle around a chess board seen as a diamond is more than half table, and a rectangle around
 * the nonogram board covers a strip of wall its foreshortened right edge does not reach. Each prop
 * therefore gets a polygon that follows its real silhouette, and the browser hit-tests the polygon
 * interior (`pointer-events: fill`), so the non-rectangular hit region is real rather than a hover
 * outline drawn over a rectangular button.
 *
 * WHY THE HOTSPOTS ARE AN SVG WITH THE ART'S OWN VIEWBOX
 * So that no coordinate is ever converted. `viewBox="0 0 1536 1024"` means the numbers in
 * `quads.data.ts` are literally source-art pixels, and `preserveAspectRatio="xMidYMid slice"` is by
 * definition the same scaling rule as the image's `object-fit: cover` — so the polygons and the
 * painting are locked together by the browser at every size, with no measurement, no resize handler
 * and no rounding step where drift could enter. (The preview layer cannot use that mechanism, which
 * is why it is the only part that measures. See fit.ts.)
 *
 * Not the default backend. `3d` is what a player sees (PROJECT.md, "Visual direction"); this is
 * reached with `?cabin=backdrop` and exists so the still-backdrop direction can be judged against
 * the 3D room rather than argued about. The 3D path is untouched.
 */
export const CabinBackdrop: React.FC<{
  topic: TopicId;
  /**
   * Composite live puzzle previews onto the flat props. **Off by default** — see the block comment
   * on `PREVIEWS_DEFAULT` for why correct, verified code is dormant and what turns it back on.
   */
  previews?: boolean;
  /**
   * Master switch for the aliveness layer. On by default; `false` renders the still exactly as it
   * rendered before the effects existed, which is the comparison an art review actually wants.
   */
  alive?: boolean;
  /**
   * Per-effect switches inside the aliveness layer (`firelight`, `shaft`, `parallax`), all on by
   * default. Passed straight through — see `CabinAliveness`, which owns the semantics.
   */
  effects?: Partial<Record<AlivenessEffect, boolean>>;
}> = ({ topic, previews = PREVIEWS_DEFAULT, alive = true, effects }) => {
  const room = backdropRoomFor(topic);
  const frameRef = useRef<HTMLDivElement>(null);
  const parallaxRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const artWidth = room?.artWidth ?? ART_WIDTH;
  const artHeight = room?.artHeight ?? ART_HEIGHT;
  const fit = useFitToElement(frameRef, artWidth, artHeight, FIT_MODE);

  const props = room?.props ?? [];
  const flats = previews ? props.filter((p): p is FlatProp => p.kind === "flat") : [];
  // Undefined for a room whose plate has not been measured, and for a topic with no room at all.
  // Both must render the still without effects rather than with guessed ones — see `RoomAliveness`.
  const aliveness = alive ? room?.aliveness : undefined;

  return (
    <div className="cabin-backdrop" ref={frameRef} data-topic={topic} data-previews={previews}>
      {/*
        ===========================================================================================
        THE PARALLAX ELEMENT. EVERYTHING THAT MUST MOVE TOGETHER LIVES INSIDE IT.
        ===========================================================================================
        `CabinAliveness` offers two ways to attach its cursor parallax: render the art as its
        `children` (which it puts inside its own transformed layer), or hand it a `parallaxTarget`
        and let it drive an element it does not own. This uses the second, and the reason is a
        z-order one that the first cannot satisfy.

        Three things have to be true at once:
          1. the effects paint OVER the painting — otherwise there is no point to them;
          2. the hover/focus trace paints OVER the effects — a keyboard user's only cue for where
             they are cannot be sitting underneath a glow that brightens and dims on its own;
          3. the painting, the hit polygons and the effects all move by the SAME transform — a
             hotspot that does not track the art it points at drifts off the object the moment the
             cursor moves, which is a worse bug than no parallax at all because it is intermittent.

        As children, the art is wrapped in `.cabin-aliveness-art`, which carries `will-change:
        filter` and takes a `filter` every frame for the fire's breath. Both make it a stacking
        context, so nothing nested inside it — the hotspot SVG included — can be lifted above the
        component's own effect layers by any z-index. (1) and (2) would be mutually exclusive.

        Driving this wrapper instead makes document order do the whole job: art, then effects, then
        hotspots, all three painted in that order and all three carrying one transform written to
        one element. The CSS transition for that transform has to be declared on this element too —
        it normally lives on the component's internal layer, which is now unused. See
        `.cabin-backdrop-parallax` in the stylesheet.
      */}
      <div className="cabin-backdrop-parallax" ref={parallaxRef}>
        {room ? <Backdrop sources={room.sources} imgRef={imgRef} /> : null}

        {/* The static hearth wash is what this component had instead of a fire. Where a room has
            measured firelight it is strictly worse than the real thing — same idea, fixed
            brightness, and positioned as a percentage of the frame rather than of the art, so it
            slides off the fireplace as the window's aspect ratio changes. It stays for rooms with
            no measured light, which is the only case it was ever right for. */}
        {aliveness?.firelight ? null : (
          <div className="cabin-backdrop-hearthlight" aria-hidden="true" />
        )}

        {/*
          Preview layer. Sized to the art in CSS pixels and then scaled as a whole, so its children's
          coordinate space IS art pixels — which is what lets each preview's matrix3d be computed
          purely from `quads.data.ts` with no viewport arithmetic anywhere in it. `aria-hidden`
          because every preview is decorative: the polygon above it is the named control.

          The layer itself is rendered even when `previews` is off, empty. It costs one absolutely
          positioned, pointer-transparent, aria-hidden div with no children and no paint, and keeping
          it means the fit measurement, the scale transform and the layer's stacking position are all
          still live and still under test in the shipping configuration — so the dormant path cannot
          quietly break while switched off, which is the usual way a feature flag turns into rot.
        */}
        <div
          className="cabin-backdrop-props"
          style={{ width: artWidth, height: artHeight, transform: fitTransform(fit) }}
          aria-hidden="true"
        >
          {flats.map((prop) => (
            <FlatPropPreview key={prop.gadgetId} prop={prop} />
          ))}
        </div>

        {aliveness ? (
          /*
            The aliveness layer, in the art's own pixel space — the same trick, and the same
            measured fit, as the preview layer above it.

            IT CANNOT JUST BE MOUNTED ON THE FRAME. `CabinAliveness` positions every region as a
            percentage of the element it is mounted in, and its mote canvas scales art pixels by
            `boxSize / artSize` on each axis independently. Both are correct for an element that IS
            the art — and this backdrop is `object-fit: cover`, so the frame is emphatically not:
            the art overflows it on one axis by whatever the viewport's aspect ratio happens to be.
            Mounted on the frame, every glow would be off the object it was measured over by up to
            half the overflow, and the drift would change as the window is resized. Sizing this
            wrapper to the art and scaling it by the cover fit makes the percentages exact again.

            AND IT IS LAID OUT, NOT TRANSFORMED — the one difference from the preview layer above,
            and it is a bug fix rather than a preference. The previews are art-sized and scaled by
            `fitTransform` because their children's `matrix3d` has to be composed in art pixels. The
            effects need no such thing (every region is a percentage), and paying the transform
            anyway breaks the mote canvas: a CSS transform does not change an element's layout box,
            so a `ResizeObserver` watching the effect layer sees 1536x1024 forever and never fires
            when the fit changes. The canvas is sized from `getBoundingClientRect`, which IS
            transform-aware, so it would be measured once at the zero scale of the first paint —
            before the fit is measured — and never again: motes at a 300x150 default backing store,
            i.e. no motes at all. Caught in the browser; jsdom cannot see it, because jsdom has no
            layout for a ResizeObserver to observe. Giving the wrapper the cover rect as real CSS
            pixels makes the layout box track the fit, so the observer fires exactly when it should.

            `mix-blend-mode` belongs on this wrapper and not on the glows, for the same reason the
            preview layer's `hard-light` does: this element is a stacking context (a blend mode
            makes one), so a blend declared on a child composites against its transparent siblings
            and never sees the painting at all. Declared on the group, the whole composited effect
            screens onto the image below — which is what light does, and it is why the fire can
            brighten the room through a layer it is not a child of.
          */
          <div
            className="cabin-backdrop-aliveness"
            style={{
              left: fit.offsetX,
              top: fit.offsetY,
              width: artWidth * fit.scale,
              height: artHeight * fit.scale,
            }}
            aria-hidden="true"
          >
            <CabinAliveness
              art={{ width: artWidth, height: artHeight }}
              firelight={aliveness.firelight}
              shaft={aliveness.shaft}
              effects={effects}
              // The transform goes on the wrapper above, not on this layer: see the block comment
              // on `.cabin-backdrop-parallax`. The breath goes on the <img> itself, because the art
              // is not this component's child here and a brightness filter has to land on pixels.
              parallaxTarget={parallaxRef}
              breathTarget={imgRef}
            />
          </div>
        ) : null}

        {/* Hotspots go last so they sit above the previews AND above the effects, and own every
            pointer event. Nothing in the aliveness tree can take one back: every node in it
            computes `pointer-events: none`, and `.cabin-backdrop-hit` opts itself back in. */}
        <svg
          className="cabin-backdrop-hotspots"
          viewBox={`0 0 ${artWidth} ${artHeight}`}
          preserveAspectRatio={svgPreserveAspectRatio(FIT_MODE)}
        >
          {/* Names the group, not the props. It cannot be aria-hidden — its children are the room's
              only controls — so it gets a title that says what the layer is for. */}
          <title>Things you can use in this room</title>
          {props.map((prop) => (
            <PropHotspot key={prop.gadgetId} prop={prop} />
          ))}
        </svg>
      </div>
    </div>
  );
};

/**
 * The backdrop image, walking a list of candidate URLs.
 *
 * The final still and the concept still it was measured against live in different places, and only
 * one of them exists at any given moment (see the note on `sources` in quads.data.ts). Advancing on
 * `error` means the room picks up the real art the instant it appears, with no code change and no
 * build-time check for a file that is gitignored. Running off the end of the list leaves the
 * container's own warm wash, which is exactly what `CabinStatic` does for a missing painting — the
 * polygons and previews keep working either way.
 */
function Backdrop({
  sources,
  imgRef,
}: {
  sources: readonly string[];
  /** The fire's brightness breath is written onto this node. See `breathTarget`. */
  imgRef: RefObject<HTMLImageElement>;
}): JSX.Element | null {
  const [index, setIndex] = useState(0);
  const src = sources[index];
  if (src === undefined) return null;
  return (
    <img
      ref={imgRef}
      className="cabin-backdrop-img"
      src={src}
      alt=""
      aria-hidden="true"
      onError={() => setIndex((i) => i + 1)}
    />
  );
}

/** A flat prop's warped preview, or nothing when that gadget has no preview renderer. */
function FlatPropPreview({ prop }: { prop: FlatProp }): JSX.Element | null {
  const snapshot = usePreviewSnapshot(prop.gadgetId);
  if (snapshot === null) return null;

  // Source rectangle sized to the quad so strokes land at roughly 1:1 against the art they sit on
  // (see quadSourceSize). The matrix then maps that rectangle onto the quad's absolute art
  // coordinates — which is why the element needs no left/top of its own.
  const { width, height } = quadSourceSize(prop.quad);
  const transform = quadTransform(width, height, prop.quad);
  // Unreachable for authored data (quads.data.test.ts proves every flat quad solves), but a quad
  // edited into a degenerate shape must drop its preview rather than render a NaN transform, which
  // browsers treat as `none` and would slap the board flat across the top-left of the room.
  if (transform === null) return null;

  return (
    <div className="cbd-preview" style={{ width, height, transform }} data-preview={prop.gadgetId}>
      <PreviewFor snapshot={snapshot} />
    </div>
  );
}

/**
 * One prop's hotspot: an invisible hit polygon plus two decorative polygons that trace the object's
 * outline on hover and keyboard focus.
 *
 * THE THREE POLYGONS
 * `hit` carries the interaction and nothing else: `fill="transparent"` with `pointer-events: fill`,
 * which per the SVG spec makes the *interior* the hit region regardless of what the fill paints — so
 * the click target is the silhouette, not its bounding box, and no visible fill is added over the
 * painting. `halo` and `trace` follow it in document order (so they paint on top, and so plain CSS
 * sibling selectors can react to `:hover` / `:focus-visible` on `hit` without any React state) and
 * opt out of pointer events entirely.
 *
 * A dark halo under a bright line is what makes the outline readable over warm painting without
 * defacing it: a single bright stroke disappears against firelight on the pegboard and screams
 * against the dark bookshelf, while the pair reads on both.
 *
 * KEYBOARD
 * An SVG shape with `tabindex` is focusable but is not a button, so Enter and Space do not fire a
 * click on their own — hence the explicit handler. Space is prevented from its default (scrolling
 * the page) before activating.
 */
function PropHotspot({ prop }: { prop: BackdropProp }): JSX.Element {
  const points = toSvgPoints(propPolygon(prop));
  const activate = () => useGame.getState().focusGadget(prop.gadgetId);
  const onKeyDown = (event: KeyboardEvent<SVGPolygonElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    activate();
  };

  return (
    <g className="cabin-backdrop-prop" data-kind={prop.kind}>
      <polygon
        className="cabin-backdrop-hit"
        points={points}
        // biome-ignore lint/a11y/useSemanticElements: the rule wants a <button>, and there is no
        // <button> that can be a perspective quad. The control has to be the polygon itself —
        // that is the entire premise of this component (see the header comment) — so the ARIA
        // contract is honoured by hand instead: role, tabindex, accessible name, and Enter/Space
        // activation are all supplied below.
        role="button"
        tabIndex={0}
        aria-label={prop.label}
        data-prop={prop.gadgetId}
        onClick={activate}
        onKeyDown={onKeyDown}
      >
        {/* Native tooltip on hover. Identical text to `aria-label`, which takes precedence for the
            accessible name, so the two can never announce different things. */}
        <title>{prop.label}</title>
      </polygon>
      <polygon className="cabin-backdrop-halo" points={points} />
      <polygon className="cabin-backdrop-trace" points={points} />
    </g>
  );
}

export default CabinBackdrop;
