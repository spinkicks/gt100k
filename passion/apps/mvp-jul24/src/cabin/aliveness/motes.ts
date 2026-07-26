/**
 * Dust motes drifting in the window light shaft.
 *
 * The field is generated once from a seed and then never mutated: a mote's position at time `t` is
 * computed from its immutable phase and speed, not integrated frame by frame. That buys three
 * things the mockup's per-frame integration did not have — the same `t` always draws the same
 * frame (so a screenshot is reproducible), the drift speed is identical at 30fps and 144fps, and
 * respawning a mote at the top of the shaft needs no `Math.random()` in the render path (it is just
 * `v` wrapping past 1).
 *
 * Motes live in the shaft's own `(u, v)` parameter space rather than in pixels: `u` across, `v`
 * down. `quadPoint` maps that onto the painted trapezoid, so a mote physically cannot escape the
 * shaft that was measured off the image — and the field survives a window resize untouched, since
 * nothing in it is in device pixels.
 */
import { type ArtSize, type ShaftRegion, quadPoint } from "./regions";
import { hash01 } from "./signal";

/**
 * One mote. All fields are constants chosen at build time; the only thing that changes per frame
 * is `t`.
 */
export interface Mote {
  /** Starting position in shaft space, both 0–1. */
  u0: number;
  v0: number;
  /** Radius in art pixels (scaled to CSS pixels at draw time). */
  r: number;
  /** Downward speed, in shaft-heights per second. */
  fall: number;
  /** Sideways speed, in shaft-widths per second. Signed. */
  drift: number;
  /** Twinkle phase and rate. */
  phase: number;
  twinkle: number;
}

/**
 * A modest count on purpose. The entire argument for a still backdrop is that it costs far less
 * than a WebGL scene, and 70 sprite blits per frame is roughly free where 70 per-frame radial
 * gradients would not be. Unlike the mockup, the count does not scale with window width: a
 * width-dependent count makes the field non-deterministic across machines and reshuffles every
 * mote on resize, for a difference nobody can see.
 */
export const DEFAULT_MOTE_COUNT = 70;

/**
 * Build the field. Deterministic in `(count, seed)` — same inputs, same motes, forever. Each mote
 * draws its seven numbers from consecutive hash indices, so adding a field later does not reshuffle
 * the motes before it.
 */
export function buildMoteField(count: number, seed: number): Mote[] {
  const motes: Mote[] = [];
  for (let i = 0; i < count; i++) {
    const h = (k: number): number => hash01(seed, i * 8 + k);
    motes.push({
      u0: h(0),
      v0: h(1),
      r: 0.35 + h(2) * 1.55,
      fall: 0.006 + h(3) * 0.024,
      drift: (h(4) * 2 - 1) * 0.012,
      phase: h(5) * Math.PI * 2,
      twinkle: 0.6 + h(6) * 1.5,
    });
  }
  return motes;
}

const fract = (v: number): number => v - Math.floor(v);

/** Where a mote is at time `t`, in shaft space. Both components wrap into 0–1. */
export function motePosition(m: Mote, t: number): { u: number; v: number } {
  return {
    // a small sway on top of the linear drift, so the fall is not a straight line
    u: fract(m.u0 + m.drift * t + 0.02 * Math.sin(t * m.twinkle * 0.5 + m.phase)),
    v: fract(m.v0 + m.fall * t),
  };
}

/**
 * How bright a mote is at time `t`, 0–1. `edge` fades motes out towards the quad's borders — the
 * squared sine product is what stops the shaft from having a visible hard edge where the trapezoid
 * ends, which is the single most important detail in making this read as light and not as a
 * clipped rectangle of particles.
 */
export function moteAlpha(m: Mote, u: number, v: number, t: number): number {
  const edge = Math.sin(Math.PI * u) * Math.sin(Math.PI * v);
  const twinkle = 0.55 + 0.45 * Math.sin(t * m.twinkle + m.phase);
  return 0.5 * edge * edge * twinkle;
}

/**
 * `getContext("2d")` guarded: jsdom has no canvas implementation and throws a "not implemented"
 * error into the virtual console, which would both fail and spam every test that mounts the
 * component. A null context simply means the mote layer draws nothing, which is the correct
 * degradation everywhere it can happen (jsdom, or a browser refusing a context under memory
 * pressure).
 */
export function get2dContext(canvas: HTMLCanvasElement | null): CanvasRenderingContext2D | null {
  if (!canvas) return null;
  try {
    return canvas.getContext("2d");
  } catch {
    return null;
  }
}

/**
 * One pre-tinted radial-gradient sprite, blitted per mote. Building a `createRadialGradient` per
 * mote per frame (as the mockup did) allocates ~70 gradient objects every 16ms; baking the gradient
 * into a small offscreen canvas once and calling `drawImage` is visually identical and does not
 * allocate at all.
 */
export function buildMoteSprite(tint: readonly [number, number, number]): HTMLCanvasElement | null {
  const size = 32;
  const sprite = document.createElement("canvas");
  sprite.width = size;
  sprite.height = size;
  const ctx = get2dContext(sprite);
  if (!ctx) return null;
  const half = size / 2;
  const [r, g, b] = tint;
  const grad = ctx.createRadialGradient(half, half, 0, half, half, half);
  grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.95)`);
  grad.addColorStop(0.35, `rgba(${r}, ${g}, ${b}, 0.35)`);
  grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return sprite;
}

export interface DrawMotesOptions {
  ctx: CanvasRenderingContext2D;
  sprite: HTMLCanvasElement;
  motes: readonly Mote[];
  shaft: ShaftRegion;
  art: ArtSize;
  /** CSS pixel size of the canvas (the context is already scaled by DPR). */
  width: number;
  height: number;
  /**
   * Seconds since mount. There is no separate "still" mode: because every mote is a pure function
   * of `t`, a reduced-motion or frozen frame is just this function called once with a fixed `t` and
   * never called again.
   */
  t: number;
}

/**
 * Draw the whole field. `lighter` compositing so overlapping motes add rather than occlude, which
 * is how out-of-focus specks in a light beam actually behave.
 */
export function drawMotes(o: DrawMotesOptions): void {
  const { ctx, sprite, motes, shaft, art, width, height, t } = o;
  ctx.clearRect(0, 0, width, height);
  const prev = ctx.globalCompositeOperation;
  ctx.globalCompositeOperation = "lighter";
  // x and y scale independently: the CSS layers position by percentage and therefore stretch with
  // the container, so the canvas has to stretch the same way or the motes leave the painted shaft
  const sx = width / art.width;
  const sy = height / art.height;
  const rScale = Math.max(sx, sy);
  for (const m of motes) {
    const { u, v } = motePosition(m, t);
    const alpha = moteAlpha(m, u, v, t);
    // below ~1/255 of a pixel value, a blit is pure cost
    if (alpha <= 0.004) continue;
    const p = quadPoint(shaft, u, v);
    const x = p.x * sx;
    const y = p.y * sy;
    // 3.2× because the sprite is mostly falloff: the visible speck is the bright middle of it
    const r = Math.max(0.4, m.r * rScale * 1.35) * 3.2;
    ctx.globalAlpha = alpha;
    ctx.drawImage(sprite, x - r, y - r, r * 2, r * 2);
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = prev;
}
