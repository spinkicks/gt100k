// What to put in front of this child next, and why.
//
// `@gt100k/surfacing` has held this policy since it was written and has been imported by nothing.
// The child surface cannot use it: the map has two enterable cabins and shows both, so there is no
// selection to make. The guide can, and is the person the product already routes every other
// decision through.
//
// The finding it carries is the one that makes it worth surfacing at all. From
// `06-activity-design-ages-6-8.md` §2.3: in a multi-session maths game (Number Navigation, n = 212),
// children whose situational interest was not maintained across sessions showed a marked decline in
// domain interest pre-to-post. Showing a child something new is not free, it is a debt. A guide who
// can see which domains are owed spaced re-exposure can pay them; a guide who cannot is being asked
// to avoid a harm they have no way of seeing.
//
// CORRECTED. This used to read "ended BELOW children never triggered at all". That ranks one
// study's unmaintained group against a DIFFERENT study's untouched control — a four-week
// primary-science trial, whose control also decayed — and no such comparison was run. Both patterns
// lose ground and only trigger-plus-maintenance gains, which is the same reason to build this panel
// and one the sources actually carry.
import { selectHoldOut, type Exposure, type HoldOutReason } from "@gt100k/surfacing";
import { CABINS } from "@gt100k/two-axis-tagging";
import type { StudentProfile } from "@gt100k/student-profile";
import { currentRead } from "@gt100k/student-profile";

import { CONSOLE_CATALOG, nowFor } from "./console-data.js";
import { specPath } from "./vocab.js";

export interface OfferSuggestion {
  /**
   * The domain this offer is about, at the grain the policy decided it.
   *
   * Unique within a slate: `selectHoldOut` keys its reasons by serialised path and takes a domain
   * at most once, so this doubles as the row's stable identity.
   */
  readonly domainPath: readonly string[];
  /**
   * `Math & Puzzles › Logic Puzzles`. The WHOLE path, because the cabin alone is not an action.
   *
   * This used to be `DOMAINS[path[0]]`, which threw the subtopic away. Debts are counted per
   * domain path (`occasionsByDomain` keys on the full path), so a child owed a follow-up in two
   * subtopics of one cabin produced two rows reading "Math & Puzzles", identical down to the
   * sentence beside them. A guide could not tell which was which, and the two also collided as one
   * React key. `specPath` is what every other panel in this console already renders paths with.
   */
  readonly label: string;
  readonly reason: HoldOutReason;
  /** Plain words for a guide who has never read the research this comes from. */
  readonly because: string;
}

const BECAUSE: Readonly<Record<HoldOutReason, string>> = {
  // Deliberately blunt. A guide skimming this needs to know that dropping it now is worse than
  // never having started, which is the counterintuitive half of the finding.
  "maintenance-debt":
    "Started and not yet followed up. Stopping here tends to leave a child less interested than never trying it.",
  "falsification-probe":
    "We expect this one to be declined. Offering it is how we find out we are wrong about a child.",
  "never-offered": "Not yet seen. Worth one look now that nothing else is owed.",
};

/**
 * The short label for a reason, used as the heading of the group that carries it.
 *
 * Separate from `BECAUSE` because they do different jobs: this one is scanned, that one is read
 * once. Neither restates the other.
 */
const REASON_HEADING: Readonly<Record<HoldOutReason, string>> = {
  "maintenance-debt": "Owed a follow-up",
  "falsification-probe": "A check on our read",
  "never-offered": "Somewhere new",
};

/** One reason, its explanation, and every domain that qualifies under it. */
export interface OfferGroup {
  readonly reason: HoldOutReason;
  /** Short, for scanning. */
  readonly heading: string;
  /** The explanation, held ONCE for the whole group; see `groupOffers`. */
  readonly because: string;
  readonly offers: readonly OfferSuggestion[];
}

/**
 * Turn a child's own record into a short slate.
 *
 * Exposures come from the profile's surfaced log, which is the same history the disconfirming
 * signals are derived from, so the guide is reading the child's actual record rather than a
 * parallel one kept for display.
 */
export function offersForKid(profile: StudentProfile | undefined): readonly OfferSuggestion[] {
  if (!profile) return [];

  const history: readonly Exposure[] = profile.surfaced.flatMap((s) => {
    const art = CONSOLE_CATALOG.get(s.artifactId);
    return art ? [{ domainPath: art.domainPath, timestamp: s.timestamp }] : [];
  });

  const now = nowFor(profile.kidId);
  const read = currentRead(profile, { catalog: CONSOLE_CATALOG }, now);
  const slate = selectHoldOut({
    beliefs: read.cells,
    history,
    candidates: [...CABINS],
    now,
  });

  const out: OfferSuggestion[] = [];
  const add = (path: readonly string[] | undefined): void => {
    if (!path) return;
    const reason = slate.reasons.get(path.join("/"));
    if (!reason) return;
    out.push({ domainPath: path, label: specPath(path), reason, because: BECAUSE[reason] });
  };

  // Debts first, in the order the policy put them, because that is the policy: what is owed is paid
  // before breadth is bought.
  for (const p of slate.owed) add(p);
  add(slate.probe);
  add(slate.fresh);
  return out;
}

/**
 * Gather a slate by reason, preserving the policy's order.
 *
 * The reason sentence is a property of the REASON CODE, not of the domain, so three owed domains
 * used to carry three copies of the same 18 words. Repetition on that scale reads as a rendering
 * fault rather than as three findings: the eye takes the block as one paragraph and stops
 * distinguishing the rows, which is exactly what a guide must do here. Said once per group, the
 * rows left over are the part that actually differs.
 *
 * First-appearance order, so the policy's ranking survives the grouping: debts are paid before
 * breadth is bought, and the group order has to say so.
 */
export function groupOffers(offers: readonly OfferSuggestion[]): readonly OfferGroup[] {
  const byReason = new Map<HoldOutReason, OfferSuggestion[]>();
  for (const o of offers) {
    const held = byReason.get(o.reason);
    if (held === undefined) byReason.set(o.reason, [o]);
    else held.push(o);
  }

  return [...byReason.entries()].map(([reason, group]) => ({
    reason,
    heading: REASON_HEADING[reason],
    because: BECAUSE[reason],
    offers: group,
  }));
}
