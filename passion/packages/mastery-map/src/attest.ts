/**
 * How a child gets onto a rung when the climbing happened somewhere we do not run.
 *
 * THE PROBLEM THIS EXISTS FOR. Slice 2 derives a standing from artefacts made in the Project Studio,
 * which works for a child building something on our surfaces and not at all for the ordinary case.
 * We do not build the learning apps (`docs/decisions/2026-07-30-mastery-scaffold.md` §4): if the map
 * says play rated games every week, chess.com already exists and we point at it. A child playing ten
 * hours a week there emits nothing into this system, so the map knows what the climb consists of and
 * cannot see anybody climbing it.
 *
 * WHAT A LINK PROVES, AND WHAT IT CANNOT. A chess.com game URL is a public record on a third party's
 * server, so the child cannot fabricate the game — that part is stronger evidence than anything the
 * studio produces. What a link cannot prove is that THEY played it, and the gap is trivial to
 * exploit: paste somebody else's games. So a link is never evidence on its own here. It becomes
 * evidence only after a `@gt100k/socratic-defense` session over it, because a child who did not play
 * a game cannot explain their own decisions inside it. That is SPOV 5 of `passionBrainlift.md`
 * applied to a new artefact type: the process plus a short human-examined defense, because neither
 * alone is enough.
 *
 * ACCOUNT OWNERSHIP IS OUT OF SCOPE HERE, deliberately. Linking games from an account does not prove
 * it is your account, and the cheap fix is to bind the account ONCE rather than re-prove it per
 * milestone. That binding is an identity question, which is G3, and G3 has no identity verification
 * — so the strongest honest claim today is guide-asserted, the same claim consent makes. This module
 * assumes the binding and does not fake one.
 *
 * TYPE-ONLY IMPORT of the defense engine, so this package gains no runtime dependency on it and the
 * session keeps being run by whoever owns the conversation. The pure question here is narrow: given
 * an examination that already happened, does this claim stand?
 */
import type { CoverageByFacet, Facet } from "@gt100k/socratic-defense";

import type { MilestoneEvidence } from "./select.js";

/**
 * One piece of work done somewhere else.
 *
 * `what` is the child's own sentence about what this link shows, and it is required. An attestation
 * that is a bare list of URLs asks the examiner to guess what is being claimed, and a defense
 * against an unstated claim cannot be judged thin.
 */
export interface ExternalWork {
  readonly url: string;
  readonly what: string;
  readonly at: string;
}

/**
 * The facets that decide whether a claim over external links stands.
 *
 * NOT ALL SIX. The defense engine probes `what`, `why`, `how`, `challenge`, `next` and `audience`,
 * and three of those are the wrong question here. `audience` asks who the work was for, which a
 * rated game on a server does not have; `next` asks where the child is going, which is the planner's
 * business and not evidence of what already happened; `why` asks about motivation, and a child with
 * a thin answer about why they played is not thereby someone who did not play.
 *
 * The three kept are the three a person who did not do the work cannot answer. `what` — what is in
 * this game. `how` — how you arrived at it. `challenge` — what went wrong and what you would change.
 * Someone who pasted a stranger's games fails all three and cannot be coached through them in the
 * moment, which is exactly the property we need.
 */
export const AUTHORSHIP_FACETS: readonly Facet[] = ["what", "how", "challenge"];

/**
 * A child's claim on one milestone, and the examination of it.
 *
 * `coverageByFacet` and `gaps` are copied off the defense `Session` rather than referenced, because
 * an attestation is a record of a judgment made at a moment and a live session keeps moving.
 */
export interface Attestation {
  readonly id: string;
  readonly milestoneId: string;
  readonly links: readonly ExternalWork[];
  /** Absent when nobody has examined this yet, which is the ordinary state right after submission. */
  readonly examined?: {
    readonly at: string;
    readonly coverageByFacet: CoverageByFacet;
    /** Facets the engine judged below its own `COVERED` threshold. */
    readonly gaps: readonly Facet[];
  };
}

/** Why an attestation contributes nothing, or `null` when it contributes. */
export type RefusalReason =
  /** Submitted, nobody has examined it. Not a failure — a queue. */
  | "not-examined"
  /** Examined, and the child could not account for the work on a facet that speaks to authorship. */
  | "authorship-gap"
  /** No links, so there is nothing to have examined. */
  | "no-links";

/**
 * Whether a claim stands, and if not, why not.
 *
 * ALL OR NOTHING, ON PURPOSE. A thin defense does not reduce the count of links, it discards them.
 * The alternative — scaling `artifactCount` by how well the child answered — would quietly merge two
 * things `MilestoneEvidence` keeps apart: how much work stands behind a rung, and how good it was.
 * `artifactCount` is a count of work and the doc comment on it says so. Blending a judgment into it
 * would make every downstream reading of that number a judgment too, and none of them know it.
 */
export function refusalFor(a: Attestation): RefusalReason | null {
  if (a.links.length === 0) return "no-links";
  if (a.examined === undefined) return "not-examined";
  return a.examined.gaps.some((g) => AUTHORSHIP_FACETS.includes(g)) ? "authorship-gap" : null;
}

/**
 * The evidence links a set of attestations contributes, in the shape `readMap` already consumes.
 *
 * Each attestation becomes one `MilestoneEvidence` whose `artifactCount` is its number of links, so
 * external work and studio work are counted in the same units and the Shavelson caution on
 * `contributionOf` applies to both alike: one artefact is badly underpowered as proof of a
 * capability, and so are three. Nothing here shortcuts that — an attestation that stands still only
 * adds to the pile it is judged against.
 *
 * `projectId` carries the attestation id. A milestone can hold several attestations the way it can
 * hold several projects, and they must not collapse into one, so the id has to be distinct per
 * claim rather than per milestone.
 */
export function evidenceFromAttestations(
  attestations: readonly Attestation[],
): readonly MilestoneEvidence[] {
  const out: MilestoneEvidence[] = [];
  for (const a of attestations) {
    if (refusalFor(a) !== null) continue;
    out.push({ milestoneId: a.milestoneId, projectId: a.id, artifactCount: a.links.length });
  }
  return out;
}

/**
 * The attestations a guide should look at, and what is wrong with each.
 *
 * Separate from `evidenceFromAttestations` because the two answer different questions and a surface
 * needs both: what stands, and what is waiting on someone. A refused attestation is not a failure to
 * hide — `not-examined` is a queue, and `authorship-gap` is the single most important thing a guide
 * can be told, since it is the shape a child copying somebody else's work leaves behind.
 */
export function refusedAttestations(
  attestations: readonly Attestation[],
): readonly { readonly attestation: Attestation; readonly reason: RefusalReason }[] {
  const out: { attestation: Attestation; reason: RefusalReason }[] = [];
  for (const attestation of attestations) {
    const reason = refusalFor(attestation);
    if (reason !== null) out.push({ attestation, reason });
  }
  return out;
}
