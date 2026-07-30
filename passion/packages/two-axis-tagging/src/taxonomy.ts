// The domain (topic) axis: hierarchical cabin → sub-topic (§3.1). Coarse = cabin (robust),
// fine = sub-topic (actionable). The tail is extensible: a sub-topic can be minted at runtime,
// always parented to an existing cabin. Minting never creates a new cabin.
export const CABINS = [
  "music-sound",
  "code-computers",
  "games-strategy",
  "making-engineering",
  "art-motion",
  "influence-media",
  "science-nature",
  "math-puzzles",
] as const;

export type CabinId = (typeof CABINS)[number];

/**
 * Seed subtopics. A rough draft, expected to be expanded.
 *
 * `games-strategy/odds-and-chance` was `poker` until 2026-07-27. Two independent resource-compilation
 * passes reached the same conclusion: there is almost nothing on the open web teaching poker to
 * children that is not operated by, sponsored by, or linking to a real-money gambling site. The best
 * material found for the underlying skill was not about poker at all — press-your-luck dice games,
 * fair-bet reasoning, uneven odds — and filing those under a shelf labelled "Poker" would have been
 * the same error as tagging a resource for an age it cannot serve: a label promising one thing and a
 * shelf delivering another.
 *
 * `odds-and-chance` names the transferable construct, which is the thing worth discovering anyway:
 * decisions under uncertainty. The one genuinely poker resource we keep (MIT OCW 15.S50, poker as
 * probability and decision theory) still fits, and its own title says what it is.
 *
 * SIX ADDED 2026-07-29, and the reason is worth keeping. The three digital-making cells
 * (`robotics`, `electronics`, `3d-printing`) had no home for a child who cuts wood or sews, and the
 * three natural-science cells had none for one who watches birds or measures rain. Filing those at
 * the cabin was the tempting shortcut and is a bug: a cabin-level path is compatible with EVERY
 * subtopic under it, so a woodworking entry filed at `making-engineering` would surface on the
 * robotics shelf. `handcraft` deliberately holds both wood and cloth, because the belief worth
 * forming is "makes physical things by hand" and a cell has to be coarse enough to accumulate one.
 * `security` and `rhetoric` exist for the narrower reason that folding capture-the-flag into
 * `hardware`, or formal debate into `marketing`, would conflate two different things inside one
 * belief.
 */
export const SEED_SUBTOPICS: Record<CabinId, readonly string[]> = {
  "music-sound": ["audio-systems", "production", "instruments", "music-theory"],
  "code-computers": ["game-dev", "python", "hardware", "agentic-engineering", "security"],
  "games-strategy": ["chess", "odds-and-chance", "board-games"],
  "making-engineering": ["robotics", "electronics", "3d-printing", "handcraft", "rocketry"],
  "art-motion": ["visual", "animation", "video-editing", "3d-modeling"],
  "influence-media": ["marketing", "storytelling", "psychology", "publishing", "rhetoric"],
  "science-nature": ["botany", "physics", "astronomy", "wildlife", "weather"],
  "math-puzzles": ["competition-math", "logic-puzzles", "foundations", "statistics"],
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
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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
    hasCabin(id): id is CabinId {
      return isCabinId(id);
    },
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
