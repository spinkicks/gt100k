/**
 * The firelight signal: one flicker value per frame, and the layer styles derived from it.
 *
 * WHY ONE SIGNAL. A convincing fire is not several things flickering — it is one thing flickering
 * and everything else in the room agreeing about it. So `sampleFlicker` produces a single `level`,
 * and `firelightFrame` fans it out to the core glow, the floor pool, the room bounce and a small
 * brightness breath on the art. Drive those layers from independent oscillators and the room
 * immediately reads as four pulsing blobs; drive them from one and it reads as light.
 *
 * WHY IT IS A PURE FUNCTION OF TIME. src/cabin/scene3d/Cabin.tsx states the rule for this app: all
 * animation is a pure function of clock time, no `Math.random` in the render path, so screenshots
 * are reproducible. The mockup this is ported from broke that rule twice — its random walk drew
 * fresh `Math.random()` per frame and integrated the result, which is both unseeded *and*
 * frame-rate dependent (the same wall-clock second looks different at 30fps and 120fps). The fix
 * here is seeded value noise: pseudo-random values are hashed at integer times and smoothly
 * interpolated between, so `sampleFlicker(t, seed)` returns the same number for the same `t`
 * forever, at any frame rate, while still wandering the way a real fire does.
 *
 * The sine coefficients are lifted from the mockup unchanged. They are four incommensurate
 * frequencies (3.07 / 7.31 / 13.7 / 23.1 rad/s) precisely so the sum has no audible loop: a fire
 * that repeats every two seconds is worse than a fire that does not move.
 */

/** Default seed. Any integer works; this one is only "the seed the screenshots were taken with". */
export const DEFAULT_SEED = 0x9a71;

/** The `t` (seconds) every frozen / reduced-motion frame is evaluated at. */
export const STILL_TIME_SEC = 0;

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

/**
 * 32-bit integer avalanche hash → [0, 1). `Math.imul` keeps the multiplies in 32-bit so this is
 * bit-identical across engines, which is what makes a screenshot taken on one machine comparable
 * to one taken on another.
 */
export function hash01(seed: number, i: number): number {
  let h = Math.imul(i ^ seed, 0x9e3779b1);
  h ^= h >>> 15;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/**
 * Seeded 1D value noise in [-1, 1]: hash at each integer step, smoothstep between. This is the
 * "bounded random walk" the mockup wanted, expressed as a function of `t` instead of an
 * accumulator — same wandering character, none of the frame-rate coupling.
 */
export function valueNoise(t: number, seed: number): number {
  const i = Math.floor(t);
  const f = t - i;
  const a = hash01(seed, i) * 2 - 1;
  const b = hash01(seed, i + 1) * 2 - 1;
  // smoothstep: zero slope at both ends, so successive steps join without a visible kink
  return a + (b - a) * (f * f * (3 - 2 * f));
}

/** How many noise steps per second the flicker wanders through. */
const WALK_HZ = 1.6;

export interface FlickerSample {
  /** Main firelight intensity, 0–1. In practice roughly 0.3–0.95. */
  level: number;
  /**
   * Sideways wander of the hot core, in percent of the core's own box. Small and signed: a fire
   * leans, it does not travel. Kept separate from `level` because a brightening fire does not
   * necessarily lean, and tying them together makes the core look like it is being dragged.
   */
  jitter: number;
  /**
   * Optional second warm source, 0–1. Deliberately a *different* rhythm — faster, shallower, and
   * never dark — because a sconce or candle is a small steady flame, and giving it the fire's own
   * signal makes the two read as one light with two positions.
   */
  sconce: number;
}

/** Sample the whole warm-light signal at time `t` (seconds since mount). Pure. */
export function sampleFlicker(t: number, seed: number = DEFAULT_SEED): FlickerSample {
  // ±0.5, matching the amplitude the mockup's walk target was drawn from
  const walk = 0.5 * valueNoise(t * WALK_HZ, seed);

  const level = clamp01(
    0.63 +
      0.155 * Math.sin(t * 3.07) +
      0.1 * Math.sin(t * 7.31 + 1.2) +
      0.062 * Math.sin(t * 13.7 + 2.5) +
      0.038 * Math.sin(t * 23.1 + 0.7) +
      0.075 * walk,
  );

  const jitter = Math.sin(t * 5.1) * 0.35 + walk * 0.6;

  const sconce = clamp01(
    0.72 +
      0.2 * Math.sin(t * 9.3 + 2.1) +
      0.08 * Math.sin(t * 17.7) +
      // a second, independent noise stream so the sconce does not breathe with the hearth
      0.05 * valueNoise(t * 2.1, seed ^ 0x5f3a),
  );

  return { level, jitter, sconce };
}

/** Inline styles for one frame, written straight onto the layer nodes (never through state). */
export interface LayerFrame {
  opacity: string;
  transform?: string;
}

export interface FirelightFrame {
  core: LayerFrame;
  floor: LayerFrame;
  bounce: LayerFrame;
  sconce: LayerFrame;
  /**
   * `filter` for the backdrop art itself. The whole room brightens a hair with the fire — this is
   * the layer that sells it, because it is the only one that affects pixels the gradients do not
   * reach. Amplitude is tiny (1.5% brightness) on purpose: any more and the image visibly pumps.
   */
  artFilter: string;
}

/** Fan one flicker sample out to every dependent layer. Pure; unit-testable without a DOM. */
export function firelightFrame(s: FlickerSample): FirelightFrame {
  const { level, jitter, sconce } = s;
  return {
    core: {
      opacity: (0.34 + 0.62 * level).toFixed(3),
      // translate in % of the core's own box, so the lean scales with the room
      transform: `translate(${jitter.toFixed(2)}%, ${(-jitter * 0.3).toFixed(2)}%) scale(${(
        0.93 + 0.14 * level
      ).toFixed(3)})`,
    },
    floor: {
      opacity: (0.3 + 0.5 * level).toFixed(3),
      transform: `scale(${(0.97 + 0.06 * level).toFixed(3)})`,
    },
    // the bounce only changes brightness: a room-sized gradient that also scaled would read as a
    // breathing vignette rather than as reflected light
    bounce: { opacity: (0.4 + 0.35 * level).toFixed(3) },
    sconce: {
      opacity: (0.45 + 0.4 * sconce).toFixed(3),
      transform: `scale(${(0.96 + 0.07 * sconce).toFixed(3)})`,
    },
    artFilter: `brightness(${(0.985 + 0.035 * level).toFixed(4)}) saturate(${(
      0.99 + 0.03 * level
    ).toFixed(4)})`,
  };
}

/**
 * Opacity of the window-shaft sheen. Two very slow sines and nothing else: a shaft of daylight
 * changes because something outside moved, which happens on the order of seconds, not frames.
 */
export function shaftSheenOpacity(t: number): string {
  return (0.72 + 0.2 * Math.sin(t * 0.42) + 0.08 * Math.sin(t * 1.1)).toFixed(3);
}
