/**
 * One question, asked while the work is still happening.
 *
 * WHY NOT THE WHOLE DEFENSE. `@gt100k/socratic-defense` runs all six facets to completion, which is
 * right at the end of a project and wrong in the middle of one. A spontaneous check that takes six
 * questions is not spontaneous, it is an exam, and it interrupts the flow this product exists to
 * produce. So this borrows the engine's facets and its `Interviewer` port and asks exactly one.
 *
 * WHICH ONE. The two facets that separate a child who built something from a child who obtained it
 * are `how` and `challenge` — and `challenge` is the sharper of the two, because a child who
 * one-shotted a project has no story about what went wrong. There was no wrong. So a record with
 * nothing broken in it gets asked about the breaking, and a record that has a struggle in it already
 * gets asked how the thing actually works.
 *
 * WHAT IT DOES WITH THE ANSWER. Logs it. There is no score, no pass, and no block: see
 * `docs/decisions/2026-08-04-mid-project-interview.md` §3. The engine's `AnswerJudge` and its
 * `coverage` number are deliberately not used here — coverage exists to drive facet selection across
 * a six-turn session, and with one turn there is nothing to select. Wiring a judge in would create
 * an "understanding" score for a screen to render, which is the thing §3 forbids.
 */
import type { Facet, Interviewer, ProjectProfile } from "@gt100k/socratic-defense";
import type { Project, Thinness } from "@gt100k/project-workspace";

/** What the studio needs to show a question and log the answer. */
export interface PendingQuestion {
  readonly artifactId: string;
  readonly facet: Facet;
  readonly question: string;
}

/**
 * The facet to ask about, given what the record looks like.
 *
 * Nothing ever broke → ask about the breaking, because that is the answer a one-shot cannot invent.
 * Something did break → ask how it works, because the struggle is already on the record and the open
 * question is whether they understood what they were struggling with.
 */
export function facetFor(t: Thinness): Facet {
  return t.everStuck ? "how" : "challenge";
}

/**
 * The question, in the child's register, when no model is available.
 *
 * The studio runs offline in CI and at a demo, so the fallback has to be usable rather than a
 * placeholder. These are deliberately plain and deliberately not accusatory: per §3 the child is
 * never told they are suspected of anything, because a false positive teaches a child who did the
 * work that a machine thinks they cheated, and cheating-accusation anxiety rises with grade level.
 */
const FALLBACK: Record<Facet, string> = {
  challenge: "What was the trickiest part of getting this working?",
  how: "How does this bit actually work? Walk me through it.",
  what: "What is this, in your own words?",
  why: "Why did you make it this way and not another way?",
  next: "What would you change if you did it again?",
  audience: "Who is this for, and what will they notice first?",
};

/**
 * Ask about one artefact.
 *
 * Takes the `Interviewer` port rather than a model, so the live TFY adapter drops in unchanged and
 * the offline path is a real question rather than a stub string.
 */
export async function askAbout(
  project: Project,
  t: Thinness,
  interviewer?: Interviewer,
): Promise<PendingQuestion> {
  const facet = facetFor(t);
  const question = interviewer
    ? await interviewer
        .nextQuestion({
          profile: profileOf(project),
          transcript: [],
          targetFacet: facet,
          isFollowUp: false,
          // Always the gentlest register. A mid-build question is an interruption, and the child has
          // not asked to be examined; the depth that suits an end-of-project defense does not suit
          // somebody who is still holding the thing they are being asked about.
          readinessLevel: "emerging",
        })
        .catch(() => FALLBACK[facet])
    : FALLBACK[facet];
  return { artifactId: t.artifactId, facet, question };
}

/**
 * What gets appended to the journey.
 *
 * A `reflection` event, so the exchange lands in the same append-only log as everything else rather
 * than in a side channel a guide has to know to look in. `refs` points at the artefact, which is
 * what lets the console show the answer under the thing it is about.
 */
export function answerEntry(
  q: PendingQuestion,
  answer: string,
): { kind: "reflection"; text: string; refs: readonly string[] } {
  return {
    kind: "reflection",
    text: `${q.question}\n\n${answer.trim()}`,
    refs: [q.artifactId],
  };
}

/** The engine's profile shape, from what the studio already holds. */
function profileOf(p: Project): ProjectProfile {
  return {
    id: p.id,
    studentId: p.kidId,
    title: p.title,
    domain: p.drivingQuestion,
    summary: p.authenticMethod,
    artifactRefs: p.events
      .filter((e) => e.kind === "artifact")
      .map((e) => e.artifact?.title ?? e.text),
  };
}
