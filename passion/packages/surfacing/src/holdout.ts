// What a session must offer regardless of what the model believes.
//
// Two findings decide this and they pull opposite ways.
//
// A surface that only offers what the model expects a child to like cannot be shown to be wrong:
// every confirmation is one it arranged. A read nobody can disconfirm is not a measurement. So part
// of every slate has to be material the model predicted against.
//
// But triggering is not free. `docs/research/passion-pipeline/06-activity-design-ages-6-8.md` §2.3:
// in a multi-session maths game (n = 212), children whose situational interest was not maintained
// across sessions showed a marked decline in domain interest pre-to-post — triggered-then-abandoned
// ends BELOW untouched. Doing nothing is not neutral either: an untriggered control's individual
// interest decayed (slope −.03, p < .001) where a triggered group's rose (+.03, p < .001). "Both
// trigger-and-abandon and never-trigger lose ground. The only winning move is trigger plus
// maintenance."
//
// So showing a child something new incurs a DEBT. §D5 gives three ways to live with that and says
// not to ship a coverage pass without picking one. This picks (ii): every triggered domain is owed
// a minimum number of SPACED re-exposures before it may be dropped. Debts are paid before breadth
// is bought, which is why this engine is slow to explore. That is the intended trade: slow beats
// cheerful abandonment, because abandonment is measurably worse than never having started.
import type { CellBelief } from "@gt100k/interest-inference";
import { isCabinId, type DomainPath } from "@gt100k/two-axis-tagging";

/** One occasion on which a domain was put in front of a child. */
export interface Exposure {
  readonly domainPath: DomainPath;
  readonly timestamp: string;
}

export interface CoverageConfig {
  /**
   * Spaced occasions a domain is owed once triggered, before it may be dropped. Four sits inside
   * §D4's "4-6 spaced exposures per domain", at the low end because the debt is a floor and not a
   * target.
   */
  readonly minExposures: number;
  /** Whole days that must separate two occasions for them to count as spaced rather than a burst. */
  readonly spacingDays: number;
}

export const DEFAULT_COVERAGE_CONFIG: CoverageConfig = {
  minExposures: 4,
  spacingDays: 1,
};

export type HoldOutReason = "maintenance-debt" | "falsification-probe" | "never-offered";

export interface HoldOut {
  /** Domains already triggered and still owed spaced re-exposures. Always offered first. */
  readonly owed: readonly DomainPath[];
  /** The domain the model most expects to be declined. Absent when nothing is believed yet. */
  readonly probe?: DomainPath;
  /** One never-offered domain, and only when no debt is outstanding. */
  readonly fresh?: DomainPath;
  /** Why each domain is on the slate, keyed by serialised path, for a guide reading it. */
  readonly reasons: ReadonlyMap<string, HoldOutReason>;
}

export interface HoldOutInput {
  readonly beliefs: readonly CellBelief[];
  readonly history: readonly Exposure[];
  readonly candidates: readonly string[];
  readonly now: string;
  readonly config?: Partial<CoverageConfig>;
}

const DAY_MS = 86_400_000;
const key = (p: DomainPath | readonly string[]): string => p.join("/");

/**
 * Narrow a path to the taxonomy's, or reject it.
 *
 * `CellBelief.domainPath` is interest-inference's looser `readonly [string] | readonly [string,
 * string]`; the taxonomy's is keyed to the eight cabins. They share a name and are not the same
 * type. A belief about something outside the taxonomy is not a thing we can offer, so it is dropped
 * rather than coerced: the alternative is a slate naming a domain no surface can render.
 */
function toDomainPath(p: readonly string[]): DomainPath | null {
  const cabin = p[0];
  if (cabin === undefined || !isCabinId(cabin)) return null;
  const sub = p[1];
  return sub === undefined ? [cabin] : [cabin, sub];
}
const utcDay = (ts: string): number | null => {
  const t = Date.parse(ts);
  return Number.isNaN(t) ? null : Math.floor(t / DAY_MS);
};

/** Distinct spaced occasions per domain: same-day repeats are one occasion, per §D4. */
function occasionsByDomain(
  history: readonly Exposure[],
  spacingDays: number,
): ReadonlyMap<string, number> {
  const days = new Map<string, number[]>();
  for (const e of history) {
    const d = utcDay(e.timestamp);
    if (d === null) continue;
    const k = key(e.domainPath);
    const list = days.get(k) ?? [];
    list.push(d);
    days.set(k, list);
  }

  const out = new Map<string, number>();
  for (const [k, list] of days) {
    const sorted = [...new Set(list)].sort((a, b) => a - b);
    let count = 0;
    let last = Number.NEGATIVE_INFINITY;
    for (const d of sorted) {
      if (d - last >= spacingDays) {
        count += 1;
        last = d;
      }
    }
    out.set(k, count);
  }
  return out;
}

/**
 * The domains a session owes the child, plus the one it should bet against.
 *
 * Pure and total. Ties break by name so the slate does not depend on the order candidates arrive
 * in, and a domain appears at most once even when it qualifies for two roles.
 */
export function selectHoldOut(input: HoldOutInput): HoldOut {
  const config = { ...DEFAULT_COVERAGE_CONFIG, ...input.config };
  const occasions = occasionsByDomain(input.history, config.spacingDays);
  const reasons = new Map<string, HoldOutReason>();
  const taken = new Set<string>();

  // 1. Debts. Triggered at least once, not yet paid the minimum. Sorted by how far behind they
  //    are, then by name, so the most neglected is offered first.
  const owed: DomainPath[] = [...occasions.entries()]
    .filter(([, n]) => n > 0 && n < config.minExposures)
    .sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]))
    .map(([k]) => toDomainPath(k.split("/")))
    .filter((p): p is DomainPath => p !== null);
  for (const p of owed) {
    reasons.set(key(p), "maintenance-debt");
    taken.add(key(p));
  }

  // 2. The falsification probe: the believed domain with the lowest mean. Only domains with a
  //    belief qualify, because betting against something never seen is not a prediction.
  const believed = [...input.beliefs]
    .filter((b) => !taken.has(key(b.domainPath)))
    .sort((a, b) => a.mean - b.mean || key(a.domainPath).localeCompare(key(b.domainPath)));
  const probe = believed
    .map((b) => toDomainPath(b.domainPath))
    .find((p): p is DomainPath => p !== null);
  if (probe) {
    reasons.set(key(probe), "falsification-probe");
    taken.add(key(probe));
  }

  // 3. Breadth, and only with the debts clear. §2.3 again: a new domain the child then never sees
  //    again leaves them below where they started, so an outstanding debt blocks exploration
  //    rather than competing with it.
  const fresh =
    owed.length > 0
      ? undefined
      : [...input.candidates]
          .filter((c) => !occasions.has(c) && !taken.has(c))
          .sort((a, b) => a.localeCompare(b))
          .map((c) => toDomainPath([c]))
          .find((p): p is DomainPath => p !== null);
  if (fresh) reasons.set(key(fresh), "never-offered");

  return {
    owed,
    ...(probe === undefined ? {} : { probe }),
    ...(fresh === undefined ? {} : { fresh }),
    reasons,
  };
}
