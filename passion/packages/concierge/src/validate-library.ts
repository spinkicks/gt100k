// The curated library's validator.
//
// Under a launcher the library IS the surface. In the game a thin library only meant the concierge
// fell back to open-web retrieval, which is degraded but still answers. Here a child taps a subtopic
// and sees exactly what is filed under it, so a subtopic with nothing behind it is a dead end they
// walk into, and it teaches them the thing they were curious about is not here.
//
// That is why EMPTY_SUBTOPIC is an error rather than a warning. `06-activity-design-ages-6-8` §2.3
// found a domain that is raised and then not maintained leaves a child BELOW where they started
// (n = 212); offering a subtopic with an empty shelf is the purest available form of that.
//
// Everything else here is the same idea one level down: an entry that cannot be followed, cannot
// form a cell, or claims an age it cannot serve is a dead end wearing a label.
import {
  CABINS,
  SEED_SUBTOPICS,
  isCabinId,
  isWorkMode,
  serializePath,
  type CabinId,
} from "@gt100k/two-axis-tagging";

import { CURATED_PROVENANCE_PREFIX } from "./as-artifact.js";
import { AGE_TIERS, REPUTATION_FLOOR, type AgeTier, type CuratedResource } from "./model.js";

export type LibraryProblemCode =
  | "UNKNOWN_DOMAIN"
  | "UNKNOWN_SUBTOPIC"
  | "NO_MODES"
  | "BAD_MODE"
  | "NO_TIERS"
  | "BAD_TIER"
  | "BELOW_REPUTATION_FLOOR"
  | "BAD_REPUTATION"
  | "BAD_URL"
  | "NOT_HTTPS"
  | "NOT_CURATED"
  | "DUPLICATE_ID"
  | "DUPLICATE_URL"
  | "EMPTY_SUBTOPIC";

export type LibraryWarningCode = "TIER_UNSERVED" | "THIN_SUBTOPIC";

export interface LibraryProblem {
  readonly code: LibraryProblemCode;
  /** The entry id, or the domain path, depending on what the rule is about. */
  readonly where: string;
  readonly detail: string;
}

export interface LibraryWarning {
  readonly code: LibraryWarningCode;
  readonly where: string;
  readonly detail: string;
}

export interface LibraryReport {
  readonly ok: boolean;
  readonly problems: readonly LibraryProblem[];
  readonly warnings: readonly LibraryWarning[];
}

export interface ValidateLibraryOptions {
  /**
   * Whether every subtopic must have at least one entry. On for the shipped library, off when
   * validating a fragment (a single cabin, a test fixture) that is not meant to be complete.
   */
  readonly requireFullCoverage?: boolean;
  /** Below this, a subtopic is stocked but thin. A warning, since one good resource beats three weak. */
  readonly thinBelow?: number;
}

const DEFAULTS = { requireFullCoverage: true, thinBelow: 2 } as const;

export function validateLibrary(
  library: readonly CuratedResource[],
  options: ValidateLibraryOptions = {},
): LibraryReport {
  const { requireFullCoverage, thinBelow } = { ...DEFAULTS, ...options };
  const problems: LibraryProblem[] = [];
  const warnings: LibraryWarning[] = [];

  const seenIds = new Set<string>();
  const seenUrlByPath = new Set<string>();

  for (const r of library) {
    const at = r.id || "(no id)";

    if (seenIds.has(r.id)) {
      problems.push({
        code: "DUPLICATE_ID",
        where: at,
        detail:
          "two entries share an id; the catalog is keyed by id, so one would shadow the other",
      });
    }
    seenIds.add(r.id);

    const cabin = r.domainPath[0];
    if (!isCabinId(cabin)) {
      problems.push({ code: "UNKNOWN_DOMAIN", where: at, detail: `no such cabin: ${cabin}` });
    } else {
      const sub = r.domainPath[1];
      if (sub !== undefined && !SEED_SUBTOPICS[cabin].includes(sub)) {
        problems.push({
          code: "UNKNOWN_SUBTOPIC",
          where: at,
          detail: `${cabin} has no subtopic ${sub}`,
        });
      }
    }

    if (r.affordedModes.length === 0) {
      problems.push({
        code: "NO_MODES",
        where: at,
        detail: "affords nothing, so it forms no cell",
      });
    }
    for (const m of r.affordedModes) {
      if (!isWorkMode(m))
        problems.push({ code: "BAD_MODE", where: at, detail: `not a mode: ${m}` });
    }

    if (r.ageTiers.length === 0) {
      problems.push({
        code: "NO_TIERS",
        where: at,
        detail: "serves no age tier, so nobody sees it",
      });
    }
    for (const t of r.ageTiers) {
      if (!(AGE_TIERS as readonly string[]).includes(t)) {
        problems.push({ code: "BAD_TIER", where: at, detail: `not a tier: ${t}` });
      }
    }

    if (!Number.isFinite(r.reputation) || r.reputation < 0 || r.reputation > 1) {
      problems.push({
        code: "BAD_REPUTATION",
        where: at,
        detail: `outside [0,1]: ${r.reputation}`,
      });
    } else if (r.reputation < REPUTATION_FLOOR) {
      problems.push({
        code: "BELOW_REPUTATION_FLOOR",
        where: at,
        detail: `reputation ${r.reputation} is under the ${REPUTATION_FLOOR} the retrieval filter drops at, and curating a source the system does not trust is a contradiction`,
      });
    }

    let url: URL | null = null;
    try {
      url = new URL(r.url);
    } catch {
      problems.push({ code: "BAD_URL", where: at, detail: `unparseable: ${r.url}` });
    }
    if (url && url.protocol !== "https:") {
      problems.push({ code: "NOT_HTTPS", where: at, detail: `a child follows this: ${r.url}` });
    }

    if (!r.provenance.startsWith(CURATED_PROVENANCE_PREFIX)) {
      problems.push({
        code: "NOT_CURATED",
        where: at,
        detail: `provenance "${r.provenance}" is not hand-authored`,
      });
    }

    const urlKey = `${serializePath(r.domainPath)}::${r.url}`;
    if (seenUrlByPath.has(urlKey)) {
      problems.push({
        code: "DUPLICATE_URL",
        where: at,
        detail: "the same url is filed twice under one path, so a child would see it twice",
      });
    }
    seenUrlByPath.add(urlKey);
  }

  // Coverage. Counted per SUBTOPIC, because that is the shelf a child actually opens: an entry filed
  // at the cabin is about the whole cabin and does not stock the subtopic's shelf.
  for (const cabin of CABINS) {
    for (const sub of SEED_SUBTOPICS[cabin]) {
      const where = `${cabin}/${sub}`;
      const here = library.filter((r) => r.domainPath[0] === cabin && r.domainPath[1] === sub);

      if (here.length === 0) {
        if (requireFullCoverage) {
          problems.push({
            code: "EMPTY_SUBTOPIC",
            where,
            detail: "a child can tap this and would find nothing",
          });
        }
        continue;
      }

      if (here.length < thinBelow) {
        warnings.push({
          code: "THIN_SUBTOPIC",
          where,
          detail: `${here.length} resource(s); a child who does not like the first has nowhere to go`,
        });
      }

      const served = new Set<AgeTier>(here.flatMap((r) => r.ageTiers));
      const missing = AGE_TIERS.filter((t) => !served.has(t));
      if (missing.length > 0) {
        warnings.push({
          code: "TIER_UNSERVED",
          where,
          detail: `nothing here for ${missing.join(", ")}`,
        });
      }
    }
  }

  return { ok: problems.length === 0, problems, warnings };
}

/** Subtopics with nothing behind them, as paths, for a quick "what is left to write" list. */
export function emptySubtopics(library: readonly CuratedResource[]): readonly string[] {
  return validateLibrary(library)
    .problems.filter((p) => p.code === "EMPTY_SUBTOPIC")
    .map((p) => p.where);
}

/** Every cabin, for callers building coverage reports. */
export const ALL_CABINS: readonly CabinId[] = CABINS;
