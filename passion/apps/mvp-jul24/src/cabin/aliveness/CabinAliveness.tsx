import {
  type CSSProperties,
  type ReactNode,
  type RefObject,
  useEffect,
  useMemo,
  useRef,
} from "react";
import "./CabinAliveness.css";
import {
  DEFAULT_MOTE_COUNT,
  type Mote,
  buildMoteField,
  buildMoteSprite,
  drawMotes,
  get2dContext,
} from "./motes";
import {
  type ArtSize,
  DEFAULT_SHAFT_TINT,
  type FirelightRegions,
  type ShaftRegion,
  ellipseBoxPct,
  quadBoundsPct,
  quadClipPath,
} from "./regions";
import {
  DEFAULT_SEED,
  STILL_TIME_SEC,
  firelightFrame,
  sampleFlicker,
  shaftSheenOpacity,
} from "./signal";
import { useReducedMotion } from "./useReducedMotion";

/**
 * Makes a still generated backdrop feel inhabited, without a 3D scene behind it.
 *
 * The premise: the cabin interior is one pre-rendered image per room (PRD §5.2 — fixed camera,
 * permanently). The obvious objection to a still is that a still is dead. It answers by compositing
 * three cheap effects over the image, all of which were proven in mockups/ai-path before any of this
 * was written:
 *
 *   1. FIRELIGHT — one flicker signal (signal.ts) driving five dependent layers: a hot core over the
 *      firebox, a light pool on the floor, a whole-room bounce, an optional second warm source, and a
 *      sub-2% brightness breath on the art itself. One signal, five agreeing layers; that agreement
 *      is what makes it read as light rather than as a pulsing blob.
 *   2. DUST MOTES — canvas particles confined to the window light shaft actually painted in that
 *      image, via a hand-measured quadrilateral (motes.ts).
 *   3. PARALLAX — a few pixels of translate on cursor movement. Tiny on purpose: this is a fixed
 *      camera, and past roughly 8px a still backdrop stops suggesting life and starts reading as a
 *      photograph being slid around.
 *
 * NOTHING IS HARD-CODED PER IMAGE. Every coordinate arrives as a prop in the backdrop art's own
 * pixel space — see regions.ts for the coordinate contract, which is the same space the sibling
 * backdrop component's SVG `viewBox` uses. A room supplies its own fireplace, its own shaft quad and
 * its own sconce, or omits any of them.
 *
 * LAYOUT CONTRACT. This renders `position: absolute; inset: 0`, so the parent must be positioned and
 * must already be the box the art fills (i.e. the art's aspect ratio). If the art is letterboxed
 * inside a bigger element, mount this on the letterboxed inner element, not the outer one — nothing
 * in here can know about bars it was not told about.
 *
 * DETERMINISM. Following the rule stated at the top of src/cabin/scene3d/Cabin.tsx: every effect is a
 * pure function of clock time and a seed, with no `Math.random` anywhere in the render path, so a
 * screenshot is reproducible. `timeMs` pins a single frame outright for exactly that purpose.
 *
 * @example
 * ```tsx
 * <div style={{ position: "relative", aspectRatio: "1 / 1" }}>
 *   <CabinAliveness art={{ width: 1024, height: 1024 }} firelight={LOGIC_FIRE} shaft={LOGIC_SHAFT}>
 *     <img src="/art/cabin-logic-games.png" alt="" />
 *   </CabinAliveness>
 * </div>
 * ```
 */

/** The three independently toggleable effects. */
export type AlivenessEffect = "firelight" | "shaft" | "parallax";

export interface ParallaxOptions {
  /**
   * Overscan. The layer is scaled up by this much so the translate below can never expose an edge
   * of the art. Applied only while parallax is on, so toggling it off leaves the art exactly as
   * authored rather than at a slightly different zoom.
   */
  scale?: number;
  /** Peak horizontal translate, in percent of the frame. 0.36% of a 1440px frame is ~5px. */
  maxXPct?: number;
  /** Peak vertical translate, in percent of the frame. Smaller than X — vertical reads stronger. */
  maxYPct?: number;
}

const PARALLAX_DEFAULTS: Required<ParallaxOptions> = { scale: 1.024, maxXPct: 0.36, maxYPct: 0.28 };

export interface CabinAlivenessProps {
  /** Pixel dimensions of the backdrop art. Defines the space every region below is measured in. */
  art: ArtSize;
  /** Firelight emitters for this room. Omit for a room with no fire. */
  firelight?: FirelightRegions | null;
  /** The window light shaft this room's motes drift in. Omit for a room with no shaft. */
  shaft?: ShaftRegion | null;
  /**
   * Per-effect switches, all on by default. Useful for art review ("is the fire doing the work, or
   * the dust?") and as a perf fallback on a machine that cannot afford the canvas.
   */
  effects?: Partial<Record<AlivenessEffect, boolean>>;
  /** Seed for the flicker walk and the mote field. Same seed ⇒ same room, forever. */
  seed?: number;
  /**
   * Pin the whole component to one frame at this time (ms since mount) and run no loop at all.
   * For screenshot diffing and for tests that need a known frame.
   */
  timeMs?: number;
  /** Injectable clock, ms. Defaults to `performance.now`. Only read while animating. */
  now?: () => number;
  /** Mote count. Default 70 — see DEFAULT_MOTE_COUNT for why it is fixed and not width-scaled. */
  moteCount?: number;
  parallax?: ParallaxOptions;
  /**
   * Apply the parallax transform to this element instead of the internal layer. For the case where
   * the backdrop art lives outside this component's tree — the transform has to land on the element
   * that contains the art, or the effects move and the room does not. The element's original inline
   * transform is restored on unmount.
   */
  parallaxTarget?: RefObject<HTMLElement | null>;
  /** Same idea for the fire's brightness breath: the element holding the art. */
  breathTarget?: RefObject<HTMLElement | null>;
  className?: string;
  /**
   * Normally the backdrop image. Rendered inside the parallax layer, so children move with the art
   * (which is what a hotspot overlay needs — hotspots that do not move with the art they point at
   * drift by a few pixels the moment the cursor moves). The wrapper is `pointer-events: none`;
   * interactive children must set `pointer-events: auto` on themselves.
   */
  children?: ReactNode;
}

export const CabinAliveness: React.FC<CabinAlivenessProps> = ({
  art,
  firelight = null,
  shaft = null,
  effects,
  seed = DEFAULT_SEED,
  timeMs,
  now,
  moteCount = DEFAULT_MOTE_COUNT,
  parallax,
  parallaxTarget,
  breathTarget,
  className,
  children,
}) => {
  const reduced = useReducedMotion();

  const firelightOn = (effects?.firelight ?? true) && firelight !== null;
  const shaftOn = (effects?.shaft ?? true) && shaft !== null;
  const parallaxOn = (effects?.parallax ?? true) && !reduced && timeMs === undefined;

  const rootRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const artRef = useRef<HTMLDivElement>(null);
  const coreRef = useRef<HTMLDivElement>(null);
  const floorRef = useRef<HTMLDivElement>(null);
  const bounceRef = useRef<HTMLDivElement>(null);
  const sconceRef = useRef<HTMLDivElement>(null);
  const sheenRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const px = { ...PARALLAX_DEFAULTS, ...parallax };

  // Positions are pure geometry over props, so they only recompute when a room actually changes.
  const boxes = useMemo(
    () =>
      firelight
        ? {
            core: boxStyle(ellipseBoxPct(firelight.core, art)),
            floor: boxStyle(ellipseBoxPct(firelight.floor, art)),
            bounce: boxStyle(ellipseBoxPct(firelight.bounce, art)),
            sconce: firelight.sconce ? boxStyle(ellipseBoxPct(firelight.sconce, art)) : null,
          }
        : null,
    [firelight, art],
  );

  const sheenStyle = useMemo<CSSProperties | null>(
    () =>
      shaft ? { ...boxStyle(quadBoundsPct(shaft, art)), clipPath: quadClipPath(shaft, art) } : null,
    [shaft, art],
  );

  const motes = useMemo<Mote[]>(() => buildMoteField(moteCount, seed), [moteCount, seed]);

  /**
   * One frame. Writes straight to the DOM nodes rather than through React state: at 60fps a
   * state-driven version would reconcile the whole subtree 60 times a second to change two numbers,
   * which is exactly the cost this component exists to avoid.
   */
  const renderFrame = useRef<(t: number) => void>(() => {});
  renderFrame.current = (t: number) => {
    if (firelightOn) {
      const f = firelightFrame(sampleFlicker(t, seed));
      applyFrame(coreRef.current, f.core);
      applyFrame(floorRef.current, f.floor);
      applyFrame(bounceRef.current, f.bounce);
      applyFrame(sconceRef.current, f.sconce);
      const breathEl = breathTarget ? breathTarget.current : artRef.current;
      if (breathEl) breathEl.style.filter = f.artFilter;
    }
    if (shaftOn && shaft) {
      const sheen = sheenRef.current;
      if (sheen) sheen.style.opacity = shaftSheenOpacity(t);
      drawMoteFrame(canvasRef.current, rootRef.current, { motes, shaft, art, t });
    }
  };

  /**
   * Whether anything is allowed to move. With reduced motion on, with a pinned `timeMs`, or with both
   * animated effects switched off, the component mounts, paints one frame and schedules nothing. That
   * is the difference between "cheap" and "a rAF loop burning a wakeup every 16ms to recompute
   * constants".
   */
  const animating = !reduced && timeMs === undefined && (firelightOn || shaftOn);
  /** The one frame a non-animating mount shows: the pinned time, else the canonical still time. */
  const stillSec = timeMs !== undefined ? timeMs / 1000 : STILL_TIME_SEC;

  /**
   * Canvas sizing. The backing store is in device pixels (capped at 2× — a 3× phone would triple the
   * fill cost of a layer whose whole point is being cheap, for specks 2px across), while the drawing
   * code works in CSS pixels via the context transform.
   *
   * Declared *before* the frame loop deliberately: effects run in declaration order, so the canvas is
   * the right size before the first frame is painted into it. Otherwise a still (reduced-motion or
   * pinned) frame would be drawn once into a default 300×150 backing store and then thrown away.
   */
  useEffect(() => {
    if (!shaftOn) return;
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
    let initial = true;
    const resize = (): void => {
      const { width, height } = root.getBoundingClientRect();
      const wasInitial = initial;
      initial = false;
      // A zero-sized box is what a ResizeObserver reports for one frame before layout settles, and
      // what jsdom reports always. There is no backing store to size and nothing to paint into it,
      // and asking for a context anyway is what turns a headless run into a page of jsdom's "not
      // implemented: getContext" noise. Bailing before the ask, rather than letting get2dContext
      // swallow the result, keeps that quiet — and because `initial` was cleared above, the next
      // call with a real box still repaints the still frame this one could not draw.
      if (!(width > 0) || !(height > 0)) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      const ctx = get2dContext(canvas);
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Setting canvas.width clears the canvas, so a still frame has to be repainted — but not on the
      // initial call, where the frame loop below is about to paint it anyway.
      if (!wasInitial && !animating) renderFrame.current(stillSec);
    };
    resize();
    // ResizeObserver is absent in jsdom; the window listener is the portable half of the same job
    // (it misses container-only resizes, which is why the observer is preferred where it exists).
    if (typeof ResizeObserver === "function") {
      const ro = new ResizeObserver(resize);
      ro.observe(root);
      return () => ro.disconnect();
    }
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [shaftOn, animating, stillSec]);

  useEffect(() => {
    if (!animating) {
      renderFrame.current(stillSec);
      return;
    }
    const clock = now ?? (() => performance.now());
    const t0 = clock();
    let raf = 0;
    const tick = (): void => {
      // seconds since mount, not since the epoch: mount-relative time is reproducible
      renderFrame.current((clock() - t0) / 1000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // `renderFrame` is a ref, so a changed region/toggle is picked up without restarting the clock;
    // only the decision to run at all belongs in this dependency list.
  }, [animating, stillSec, now]);

  /**
   * Parallax. No frame loop: the target transform is written once per pointer move and a short CSS
   * transition does the easing on the compositor. A `pointermove` can fire more often than the
   * display refreshes, so writes are coalesced into at most one pending animation frame — and that
   * frame is cancelled on unmount, which is the only rAF this effect can leave behind.
   */
  useEffect(() => {
    if (!parallaxOn) return;
    const el = parallaxTarget ? parallaxTarget.current : layerRef.current;
    if (!el) return;
    const originalTransform = el.style.transform;

    const rest = `scale(${px.scale})`;
    el.style.transform = rest;

    let raf = 0;
    let targetX = 0;
    let targetY = 0;
    const write = (): void => {
      raf = 0;
      el.style.transform = `${rest} translate(${(-targetX * px.maxXPct).toFixed(3)}%, ${(
        -targetY * px.maxYPct
      ).toFixed(3)}%)`;
    };
    const onMove = (e: PointerEvent): void => {
      targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetY = (e.clientY / window.innerHeight - 0.5) * 2;
      el.classList.add("is-tracking");
      if (!raf) raf = requestAnimationFrame(write);
    };
    const onLeave = (): void => {
      targetX = 0;
      targetY = 0;
      // drop the fast tracking transition so the return to rest is the slow, eased one
      el.classList.remove("is-tracking");
      if (!raf) raf = requestAnimationFrame(write);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);
    window.addEventListener("blur", onLeave);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onLeave);
      el.classList.remove("is-tracking");
      // hand a borrowed element back exactly as it was found
      el.style.transform = originalTransform;
    };
  }, [parallaxOn, parallaxTarget, px.scale, px.maxXPct, px.maxYPct]);

  /** Same courtesy for the breath: an element we do not own gets its `filter` back. */
  useEffect(() => {
    const el = breathTarget?.current;
    if (!el) return;
    const original = el.style.filter;
    return () => {
      el.style.filter = original;
    };
  }, [breathTarget]);

  return (
    <div
      ref={rootRef}
      className={className ? `cabin-aliveness ${className}` : "cabin-aliveness"}
      data-reduced-motion={reduced ? "true" : undefined}
    >
      <div ref={layerRef} className="cabin-aliveness-layer">
        {children ? (
          <div ref={artRef} className="cabin-aliveness-art">
            {children}
          </div>
        ) : null}

        {firelightOn && boxes ? (
          <div
            className="cabin-aliveness-fx cabin-aliveness-fire"
            aria-hidden="true"
            data-fx="firelight"
          >
            {/* painted back-to-front: the room bounce is behind the floor pool is behind the core */}
            <div ref={bounceRef} className="cabin-aliveness-glow is-bounce" style={boxes.bounce} />
            <div ref={floorRef} className="cabin-aliveness-glow is-floor" style={boxes.floor} />
            <div ref={coreRef} className="cabin-aliveness-glow is-core" style={boxes.core} />
            {boxes.sconce ? (
              <div
                ref={sconceRef}
                className="cabin-aliveness-glow is-sconce"
                style={boxes.sconce}
              />
            ) : null}
          </div>
        ) : null}

        {shaftOn && sheenStyle ? (
          <div
            className="cabin-aliveness-fx cabin-aliveness-shaft"
            aria-hidden="true"
            data-fx="shaft"
          >
            <div ref={sheenRef} className="cabin-aliveness-sheen" style={sheenStyle} />
            <canvas ref={canvasRef} className="cabin-aliveness-motes" />
          </div>
        ) : null}
      </div>
    </div>
  );
};

function boxStyle(b: { left: number; top: number; width: number; height: number }): CSSProperties {
  return {
    left: `${b.left.toFixed(4)}%`,
    top: `${b.top.toFixed(4)}%`,
    width: `${b.width.toFixed(4)}%`,
    height: `${b.height.toFixed(4)}%`,
  };
}

function applyFrame(el: HTMLElement | null, frame: { opacity: string; transform?: string }): void {
  if (!el) return;
  el.style.opacity = frame.opacity;
  if (frame.transform !== undefined) el.style.transform = frame.transform;
}

/**
 * The mote sprite is cached per tint on the canvas node itself. It is a function of nothing but the
 * tint, so rebuilding it per frame (or per mount) would be pure waste; hanging it off the node keeps
 * it alive exactly as long as the canvas it belongs to.
 */
interface SpriteHost extends HTMLCanvasElement {
  _moteSprite?: { key: string; sprite: HTMLCanvasElement | null };
}

function drawMoteFrame(
  canvas: HTMLCanvasElement | null,
  root: HTMLElement | null,
  o: { motes: readonly Mote[]; shaft: ShaftRegion; art: ArtSize; t: number },
): void {
  if (!canvas || !root) return;
  // Measured before the context is asked for, not after: an unlaid-out box has nothing to draw in,
  // and acquiring a context for it is both wasted and (in jsdom) noisy.
  const { width, height } = root.getBoundingClientRect();
  if (width === 0 || height === 0) return;
  const ctx = get2dContext(canvas);
  if (!ctx) return;
  const tint = o.shaft.tint ?? DEFAULT_SHAFT_TINT;
  const key = tint.join(",");
  const host = canvas as SpriteHost;
  if (host._moteSprite?.key !== key) host._moteSprite = { key, sprite: buildMoteSprite(tint) };
  const sprite = host._moteSprite.sprite;
  if (!sprite) return;
  drawMotes({ ctx, sprite, motes: o.motes, shaft: o.shaft, art: o.art, width, height, t: o.t });
}

export default CabinAliveness;
