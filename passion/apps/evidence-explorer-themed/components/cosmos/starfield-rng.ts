/**
 * Deterministic, seeded starfield generation (§U8.13 `STARFIELD`) — a mulberry32 PRNG drives every
 * star position so the field is byte-reproducible from `NEXT_PUBLIC_EXPLORER_SEED` and contains **no**
 * `Math.random` (FR-E19 / SC-E11). Points are scattered on a thick spherical shell behind the graph.
 */

/** Golden starfield constants (§U8.13). */
export const STARFIELD = {
  count: 1400,
  radius: 220,
  /** Inner shell radius as a fraction of `radius` — keeps stars behind the world, never inside it. */
  innerFraction: 0.55,
  defaultSeed: 42,
} as const;

/** mulberry32 — a tiny, fast, fully-deterministic 32-bit PRNG. Returns floats in [0,1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Parse the seed env value → a finite integer (defaults to 42 on missing/garbage input). */
export function readSeed(envValue: string | undefined): number {
  if (envValue === undefined) return STARFIELD.defaultSeed;
  const n = Number.parseInt(envValue, 10);
  return Number.isFinite(n) ? n : STARFIELD.defaultSeed;
}

/**
 * Generate `count` star positions as a flat `[x,y,z, x,y,z, …]` `Float32Array` on a spherical shell
 * of the given outer `radius`. Deterministic for a fixed `seed` (no trig on a "golden" path here, but
 * this is presentation-only decorative geometry, not a layout golden).
 */
export function generateStarfield(
  count: number = STARFIELD.count,
  radius: number = STARFIELD.radius,
  seed: number = STARFIELD.defaultSeed,
): Float32Array {
  const rand = mulberry32(seed);
  const out = new Float32Array(count * 3);
  const inner = radius * STARFIELD.innerFraction;
  for (let i = 0; i < count; i++) {
    // Uniform direction on the unit sphere (Marsaglia), then a radius in the shell [inner, radius].
    const u = rand() * 2 - 1; // z ∈ [-1,1]
    const theta = rand() * Math.PI * 2;
    const s = Math.sqrt(Math.max(0, 1 - u * u));
    const r = inner + rand() * (radius - inner);
    const dx = s * Math.cos(theta);
    const dy = s * Math.sin(theta);
    const dz = u;
    out[i * 3] = dx * r;
    out[i * 3 + 1] = dy * r;
    out[i * 3 + 2] = dz * r;
  }
  return out;
}
