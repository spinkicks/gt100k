// The domain (topic) axis: hierarchical cabin → sub-topic (§3.1). Coarse = cabin (robust),
// fine = sub-topic (actionable). The tail is extensible: a sub-topic can be minted at runtime,
// always parented to an existing cabin. Minting never creates a new cabin.
export const CABINS = [
  "music-sound", "code-computers", "games-strategy", "making-engineering",
  "art-motion", "influence-media", "science-nature", "math-puzzles",
] as const;

export type CabinId = (typeof CABINS)[number];

export const SEED_SUBTOPICS: Record<CabinId, readonly string[]> = {
  "music-sound": ["audio-systems", "production", "instruments", "music-theory"],
  "code-computers": ["game-dev", "python", "hardware", "agentic-engineering"],
  "games-strategy": ["chess", "poker", "board-games"],
  "making-engineering": ["robotics", "electronics", "3d-printing"],
  "art-motion": ["visual", "animation", "video-editing", "3d-modeling"],
  "influence-media": ["marketing", "storytelling", "psychology", "publishing"],
  "science-nature": ["botany", "physics", "astronomy"],
  "math-puzzles": ["competition-math", "logic-puzzles", "statistics"],
};

export type DomainPath = readonly [CabinId] | readonly [CabinId, string];

const CABIN_SET = new Set<string>(CABINS);
export function isCabinId(x: unknown): x is CabinId {
  return typeof x === "string" && CABIN_SET.has(x);
}

export function serializePath(p: DomainPath): string {
  return p.length === 1 ? p[0] : `${p[0]}/${p[1]}`;
}

// Deterministic slug so minting is idempotent by (cabin,label).
export function slugify(label: string): string {
  return label.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export interface Taxonomy {
  hasCabin(id: string): id is CabinId;
  hasPath(p: DomainPath): boolean;
  mintSubTopic(cabin: CabinId, label: string): DomainPath;
  subTopics(cabin: CabinId): readonly string[];
}

export function createTaxonomy(): Taxonomy {
  const subs = new Map<CabinId, Set<string>>();
  for (const c of CABINS) subs.set(c, new Set(SEED_SUBTOPICS[c]));

  return {
    hasCabin(id): id is CabinId { return isCabinId(id); },
    hasPath(p) {
      if (!isCabinId(p[0])) return false;
      if (p.length === 1) return true;
      return subs.get(p[0])?.has(p[1]) ?? false;
    },
    mintSubTopic(cabin, label) {
      if (!isCabinId(cabin)) throw new Error(`unknown cabin: ${String(cabin)}`);
      const slug = slugify(label);
      if (slug.length === 0) throw new Error("empty sub-topic label");
      subs.get(cabin)?.add(slug);
      return [cabin, slug] as const;
    },
    subTopics(cabin) {
      return [...(subs.get(cabin) ?? new Set<string>())];
    },
  };
}
