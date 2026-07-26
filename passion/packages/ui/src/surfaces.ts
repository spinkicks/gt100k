/**
 * THE SURFACES REGISTRY — the single source of truth for what surfaces this product has.
 *
 * A surface's URL is resolved per environment, and the fallback is deliberately asymmetric:
 *
 *   development → http://localhost:<dev port>, so local work is wired up with no configuration
 *   anything else (production included) → null, meaning "not reachable here", and the surface
 *   renders no link at all
 *
 * The Parent Playbook is publicly deployed for actual parents, so a production build that was
 * never told where the other surfaces live must ship NOTHING rather than a localhost link that
 * dead-ends on a parent's laptop. Production has to be told explicitly, via the env vars below.
 */

export type Audience = "guide" | "parent" | "child" | "record";

export interface Surface {
  readonly id: string;
  readonly label: string;
  readonly audience: Audience;
  readonly blurb: string;
  /** null = not reachable in this environment. */
  readonly url: string | null;
}

export type SurfaceId = "guide" | "parent" | "studio" | "evidence" | "concierge";

interface SurfaceDef {
  readonly id: SurfaceId;
  readonly label: string;
  readonly audience: Audience;
  readonly blurb: string;
  /** The established local port for this surface (docs/DEMO-SCRIPT.md, README). */
  readonly devPort: number;
}

const DEFS: readonly SurfaceDef[] = [
  {
    id: "guide",
    label: "Guide Console",
    audience: "guide",
    blurb: "See what a child keeps coming back to, and decide the next move.",
    devPort: 3020,
  },
  {
    id: "parent",
    label: "Parent Playbook",
    audience: "parent",
    blurb: "How to help at home, in plain language, with the research behind it.",
    devPort: 3055,
  },
  {
    id: "studio",
    label: "Project Studio",
    audience: "child",
    blurb: "Where the child works on the thing they are making.",
    devPort: 3010,
  },
  {
    id: "evidence",
    label: "Evidence Explorer",
    audience: "record",
    blurb: "The honest record of the work, and where every claim came from.",
    devPort: 3030,
  },
  {
    id: "concierge",
    label: "Concierge",
    audience: "record",
    blurb: "Ask a question, get an answer with its sources attached.",
    devPort: 3040,
  },
];

export interface SurfaceEnv {
  /** Usually process.env.NODE_ENV. Only the exact string "development" enables localhost. */
  readonly nodeEnv: string | undefined;
  readonly urls: Readonly<Partial<Record<SurfaceId, string | undefined>>>;
}

/**
 * Every var is named literally, never `process.env[key]`: Next inlines NEXT_PUBLIC_* by textual
 * substitution at build time, so a computed lookup would read as undefined in the browser.
 */
export function readSurfaceEnv(): SurfaceEnv {
  return {
    nodeEnv: process.env.NODE_ENV,
    urls: {
      guide: process.env.NEXT_PUBLIC_SURFACE_URL_GUIDE,
      parent: process.env.NEXT_PUBLIC_SURFACE_URL_PARENT,
      studio: process.env.NEXT_PUBLIC_SURFACE_URL_STUDIO,
      evidence: process.env.NEXT_PUBLIC_SURFACE_URL_EVIDENCE,
      concierge: process.env.NEXT_PUBLIC_SURFACE_URL_CONCIERGE,
    },
  };
}

function resolveUrl(def: SurfaceDef, env: SurfaceEnv): string | null {
  const explicit = env.urls[def.id];
  if (explicit !== undefined && explicit.trim() !== "") return explicit.trim();
  return env.nodeEnv === "development" ? `http://localhost:${def.devPort}` : null;
}

export function resolveSurfaces(env: SurfaceEnv = readSurfaceEnv()): readonly Surface[] {
  return DEFS.map((def) => ({
    id: def.id,
    label: def.label,
    audience: def.audience,
    blurb: def.blurb,
    url: resolveUrl(def, env),
  }));
}

export function findSurface(surfaces: readonly Surface[], id: string): Surface | undefined {
  return surfaces.find((s) => s.id === id);
}
