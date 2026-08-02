/**
 * The rung a child is actually on, joined to the plan that paces them.
 *
 * WHY THIS FILE EXISTS. The planner owns *when* — stage, practice dose, rest, back-off — and is
 * domain-agnostic by design. The mastery map owns *what* — the rungs of a particular domain, what
 * each one asks for, and who judges it. They were built as two halves of one answer and were never
 * connected, so the Plan tab rendered only the pacing half. With no domain knowledge to show, its
 * project brief came from `stubBriefGenerator`, which is per-stage string templates with the domain
 * name substituted in: `What about ${d} makes you want to come back and try more?` becomes "What
 * about Game Dev makes you want to come back and try more?" and, for chess, the identical sentence
 * about chess. A room of engineers read that and wrote down that the Plan tab was unbuilt.
 *
 * It reads as filler because it contains no domain knowledge, and it could not, because the half
 * that holds the domain knowledge was in a different tab.
 *
 * WHY IT IS ITS OWN MODULE. `maps` imports `map-evidence`, which imports `plan` for stage. Joining
 * inside `plan` would close that loop, so the composition sits above all three — the same reason
 * `map-evidence` gives for living in the console rather than in an engine.
 *
 * WHAT IT DOES NOT DO. It does not decide whether the child has the capability, and it does not
 * advance anybody. `reachable` is an offering decision the map already computes, `strength` is read
 * off artefacts, and both come across untouched.
 */
import { servesPath, type EvidenceStrength, type Milestone } from "@gt100k/mastery-map";
// `CuratedResource` via the planner, the way `plan.ts` takes it: the console does not depend on
// concierge directly and this file has no reason to be the first.
import { CABINS, type DomainPath } from "@gt100k/two-axis-tagging";
import type { CuratedResource } from "@gt100k/specialization-planner";

import { childReadView, type EvidenceVM } from "./maps.js";
import { workForKid } from "./map-evidence.js";
import { REVIEW_MAPS } from "./maps-seed.js";
import type { PlanCardVM } from "./plan.js";

/**
 * What a guide reads instead of the templated brief: a real rung, in the domain's own terms.
 *
 * Every field here is authored or cited domain knowledge rather than generated prose. `basis` rides
 * along because a guide is entitled to know whether the ordering rests on a published curriculum or
 * on our own reasoning, and that distinction is the whole point of the map.
 */
export interface PlanMilestoneVM {
  readonly id: string;
  readonly title: string;
  readonly capability: string;
  /** One plain sentence: why this rung sits here, and after those. */
  readonly why: string;
  /** What the ordering rests on. `model` means we reasoned it out and nobody else vouches for it. */
  readonly basis: string;
  /** Honest caveat on the ordering, where the author recorded one. */
  readonly limit: string | null;
  readonly practice: readonly { readonly title: string; readonly description: string }[];
  /** The artefact that shows the capability. This is what makes leaving costless. */
  readonly demonstration: string;
  /** A real-world opportunity the domain affords, if the author named one. Advisory, never a gate. */
  readonly opportunity: string | null;
  readonly resources: readonly CuratedResource[];
  /** How much work stands behind this rung already. Never a verdict; see `maps.ts`. */
  readonly strength: EvidenceStrength;
  readonly strengthText: string;
  readonly evidence: readonly EvidenceVM[];
}

/**
 * A view card widens `domainPath` to `readonly string[]`, and `servesPath` needs the narrow type.
 * The rule it holds must not be reimplemented (see `mastery-map/resolve.ts`), so this narrows with a
 * real check against the cabin list rather than a cast.
 */
function asDomainPath(path: readonly string[]): DomainPath | null {
  const [cabin, sub] = path;
  if (path.length !== 2 || cabin === undefined || sub === undefined) return null;
  return (CABINS as readonly string[]).includes(cabin) ? ([cabin, sub] as DomainPath) : null;
}

/**
 * The rung to put in front of a guide for this plan, or null when no map serves the domain.
 *
 * THE NEXT ONE IS THE FIRST REACHABLE RUNG WITH NOTHING BEHIND IT. A rung that already has artefacts
 * is work in progress rather than the thing to offer, and a rung that is blocked is not offerable at
 * all. Where every reachable rung already has work, the last of them is shown instead, because a
 * child mid-way through a rung still needs to see the rung.
 *
 * Null is a real answer and the caller must render it as one. Four maps exist and the catalogue runs
 * to dozens of pursuits, so most children specialise in a domain nobody has mapped — and saying that
 * plainly is better than the generated sentence it replaces.
 */
export function milestoneForPlan(kidId: string, card: PlanCardVM): PlanMilestoneVM | null {
  const path = asDomainPath(card.domainPath);
  if (path === null) return null;

  const map = REVIEW_MAPS.find((m) => m.status === "published" && servesPath(m.domainPath, path));
  if (map === undefined) return null;

  const work = workForKid(kidId);
  const view = childReadView(map, work, work.overrides);
  // A map not in use, or not fit to be, is not a map to read a child against. `childReadView`
  // already refuses in that case and returns no reads; this respects the refusal rather than
  // reaching past it into the raw milestones.
  if (view.standingRefusal !== null || view.reads.length === 0) return null;

  const offerable = view.reads.filter((r) => r.reachable);
  if (offerable.length === 0) return null;
  const read = offerable.find((r) => r.strength === "none") ?? offerable[offerable.length - 1]!;

  const ms = map.milestones.find((m) => m.id === read.id);
  if (ms === undefined) return null;

  return {
    id: ms.id,
    title: ms.title,
    capability: ms.capability,
    why: ms.ordering.reason,
    basis: ms.ordering.basis,
    limit: ms.ordering.limit ?? null,
    practice: ms.practice.map((p) => ({ title: p.title, description: p.description })),
    demonstration: ms.demonstration,
    opportunity: opportunityText(ms),
    resources: ms.resources,
    strength: read.strength,
    strengthText: read.strengthText,
    evidence: read.evidence,
  };
}

/**
 * The lowest-stage opportunity the author named, as one sentence.
 *
 * Advisory only. The access broker owns real-world contact and guardian consent is a hard blocker
 * there, so a map may say a competition exists and may never reach into the world.
 */
function opportunityText(ms: Milestone): string | null {
  const first = ms.opportunities[0];
  return first === undefined ? null : `${first.description}. ${first.readinessNote}`;
}
