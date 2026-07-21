import type { Vector3 } from "@gt100k/interest-lab-view";

/**
 * Per-domain island motifs (P1.5). Every island shares the same low-poly cap+cone+rim; without a
 * landmark the world reads as eight identical primitives in different hues. Each domain gets a small
 * emissive accent motif — a distinct silhouette that turns a hue into a *place*.
 *
 * Pure + GPU-free: `resolveDomainMotif` maps a catalog domain id → a descriptor of low-poly props
 * (geometry kind + args + local transform). `IslandMotif` (below) is the only three-touching part.
 * The descriptors are unit-tested without a GPU (they are just numbers), mirroring `resolveDomainHue`.
 */

/** The published silhouette families — one per seed domain, plus the fallback reuses `prism`. */
export const DOMAIN_MOTIF_SHAPES = [
  "anvil", // making — stacked blocks
  "sprout", // living_systems — trunk + canopy
  "prism", // symbols_math — floating octahedron
  "quill", // word_craft — a tall leaning nib
  "chime", // sound_music — concentric rings
  "arch", // movement_body — an upright hoop to leap through
  "easel", // visual_design — tilted canvas panels
  "cluster", // social_world — three linked spheres
] as const;

export type MotifShape = (typeof DOMAIN_MOTIF_SHAPES)[number];

/**
 * A low-poly geometry, tagged so `IslandMotif` can pick the matching three primitive. `args` are
 * mutable tuples because react-three-fiber's JSX geometry `args` prop rejects `readonly` tuples.
 */
export type MotifGeometry =
  | { readonly kind: "box"; readonly args: [number, number, number] }
  | { readonly kind: "cone"; readonly args: [number, number, number] }
  | { readonly kind: "cylinder"; readonly args: [number, number, number, number] }
  | { readonly kind: "octahedron"; readonly args: [number, number] }
  | { readonly kind: "torus"; readonly args: [number, number, number, number] }
  | { readonly kind: "icosahedron"; readonly args: [number, number] }
  | { readonly kind: "sphere"; readonly args: [number, number, number] };

export interface MotifProp {
  readonly geometry: MotifGeometry;
  /** Local offset from the motif anchor (which sits atop the island cap). */
  readonly position: Vector3;
  readonly rotation: Vector3;
  readonly scale: number;
}

export interface DomainMotif {
  readonly domain: string;
  readonly shape: MotifShape;
  readonly props: readonly MotifProp[];
  readonly emissiveIntensity: number;
  /** Gentle idle spin (radians/second) around Y so the landmark reads as alive, not a decal. */
  readonly spinSpeed: number;
}

const HALF_PI = Math.PI / 2;

const MOTIFS: Readonly<Record<string, Omit<DomainMotif, "domain">>> = {
  // making — a small forge/anvil: a broad base block and a stepped block above it.
  making: {
    shape: "anvil",
    emissiveIntensity: 0.55,
    spinSpeed: 0.12,
    props: [
      {
        geometry: { kind: "box", args: [0.64, 0.18, 0.44] },
        position: [0, 0.1, 0],
        rotation: [0, 0.18, 0],
        scale: 1,
      },
      {
        geometry: { kind: "box", args: [0.3, 0.26, 0.3] },
        position: [0.12, 0.32, 0],
        rotation: [0, 0.5, 0.14],
        scale: 1,
      },
    ],
  },
  // living_systems — a sprout: a thin trunk topped by a faceted canopy.
  living_systems: {
    shape: "sprout",
    emissiveIntensity: 0.7,
    spinSpeed: 0.16,
    props: [
      {
        geometry: { kind: "cylinder", args: [0.05, 0.08, 0.5, 6] },
        position: [0, 0.25, 0],
        rotation: [0, 0, 0.06],
        scale: 1,
      },
      {
        geometry: { kind: "icosahedron", args: [0.27, 0] },
        position: [0, 0.62, 0],
        rotation: [0.3, 0.4, 0],
        scale: 1,
      },
    ],
  },
  // symbols_math — a single crisp octahedron: pure, abstract, exact.
  symbols_math: {
    shape: "prism",
    emissiveIntensity: 0.85,
    spinSpeed: 0.34,
    props: [
      {
        geometry: { kind: "octahedron", args: [0.36, 0] },
        position: [0, 0.58, 0],
        rotation: [0.2, 0.4, 0],
        scale: 1,
      },
    ],
  },
  // word_craft — a quill: a tall thin cone leaning off a flat page.
  word_craft: {
    shape: "quill",
    emissiveIntensity: 0.6,
    spinSpeed: 0.1,
    props: [
      {
        geometry: { kind: "cone", args: [0.1, 0.78, 5] },
        position: [0.04, 0.52, 0],
        rotation: [0, 0, 0.34],
        scale: 1,
      },
      {
        geometry: { kind: "box", args: [0.34, 0.04, 0.24] },
        position: [0, 0.08, 0],
        rotation: [0, 0.2, 0],
        scale: 1,
      },
    ],
  },
  // sound_music — concentric chimes: two flat rings stacked like a ripple of sound.
  sound_music: {
    shape: "chime",
    emissiveIntensity: 0.8,
    spinSpeed: 0.2,
    props: [
      {
        geometry: { kind: "torus", args: [0.34, 0.05, 8, 22] },
        position: [0, 0.36, 0],
        rotation: [HALF_PI, 0, 0],
        scale: 1,
      },
      {
        geometry: { kind: "torus", args: [0.2, 0.045, 8, 20] },
        position: [0, 0.58, 0],
        rotation: [HALF_PI, 0, 0],
        scale: 1,
      },
    ],
  },
  // movement_body — an upright hoop to leap through.
  movement_body: {
    shape: "arch",
    emissiveIntensity: 0.72,
    spinSpeed: 0.24,
    props: [
      {
        geometry: { kind: "torus", args: [0.36, 0.06, 8, 24] },
        position: [0, 0.46, 0],
        rotation: [0, 0.2, 0],
        scale: 1,
      },
    ],
  },
  // visual_design — an easel: a big tilted canvas panel with a small swatch beside it.
  visual_design: {
    shape: "easel",
    emissiveIntensity: 0.68,
    spinSpeed: 0.14,
    props: [
      {
        geometry: { kind: "box", args: [0.5, 0.5, 0.04] },
        position: [0, 0.56, 0],
        rotation: [0.12, 0.62, 0.12],
        scale: 1,
      },
      {
        geometry: { kind: "box", args: [0.18, 0.18, 0.05] },
        position: [0.3, 0.3, 0.1],
        rotation: [0, 0.62, 0],
        scale: 1,
      },
    ],
  },
  // social_world — three linked spheres: a small constellation of people.
  social_world: {
    shape: "cluster",
    emissiveIntensity: 0.78,
    spinSpeed: 0.22,
    props: [
      {
        geometry: { kind: "sphere", args: [0.16, 12, 12] },
        position: [-0.24, 0.44, 0],
        rotation: [0, 0, 0],
        scale: 1,
      },
      {
        geometry: { kind: "sphere", args: [0.16, 12, 12] },
        position: [0.24, 0.44, 0],
        rotation: [0, 0, 0],
        scale: 1,
      },
      {
        geometry: { kind: "sphere", args: [0.17, 12, 12] },
        position: [0, 0.66, 0.12],
        rotation: [0, 0, 0],
        scale: 1,
      },
    ],
  },
};

// An unknown catalog domain still gets a landmark — the abstract prism, so the world never blanks out.
const FALLBACK: Omit<DomainMotif, "domain"> = MOTIFS.symbols_math!;

/**
 * Map a catalog domain id → its island motif descriptor. Pure and total: any string resolves (unknown
 * domains fall back to the abstract prism), so a catalog growing new domains never crashes the world.
 */
export function resolveDomainMotif(domain: string): DomainMotif {
  const motif = MOTIFS[domain] ?? FALLBACK;
  return { domain, ...motif };
}
