// What to put in front of this child next, and why.
//
// `@gt100k/surfacing` has held this policy since it was written and has been imported by nothing.
// The child surface cannot use it: the map has two enterable cabins and shows both, so there is no
// selection to make. The guide can, and is the person the product already routes every other
// decision through.
//
// The finding it carries is the one that makes it worth surfacing at all. From
// `06-activity-design-ages-6-8.md` §2.3: in a multi-session maths game (n = 212), children whose
// situational interest was triggered and then not maintained ended BELOW children never triggered
// at all. Showing a child something new is not free, it is a debt. A guide who can see which
// domains are owed spaced re-exposure can pay them; a guide who cannot is being asked to avoid a
// harm they have no way of seeing.
import { selectHoldOut, type Exposure, type HoldOutReason } from "@gt100k/surfacing";
import { CABINS } from "@gt100k/two-axis-tagging";
import type { StudentProfile } from "@gt100k/student-profile";
import { currentRead } from "@gt100k/student-profile";

import { CONSOLE_CATALOG, nowFor } from "./console-data.js";
import { DOMAINS } from "./vocab.js";

export interface OfferSuggestion {
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
    const cabin = path[0] ?? "";
    out.push({ label: DOMAINS[cabin] ?? cabin, reason, because: BECAUSE[reason] });
  };

  // Debts first, in the order the policy put them, because that is the policy: what is owed is paid
  // before breadth is bought.
  for (const p of slate.owed) add(p);
  add(slate.probe);
  add(slate.fresh);
  return out;
}
