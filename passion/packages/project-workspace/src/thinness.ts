/**
 * How much work stands behind an artefact.
 *
 * WHY THIS EXISTS. Operators report children handing in projects they one-shotted with a model: the
 * artefact looks fine and the child cannot account for it. The Socratic defense already answers the
 * end-of-project version of that question, but by then "did you understand this while you made it"
 * is unanswerable, because nothing is left to observe but the result.
 *
 * A one-shotted project has a signature, and it is in data we already keep. A child who genuinely
 * built something leaves a trail of failures behind it — `stuck` is described in the model as "the
 * perseverance seed" for exactly this reason. Nobody tried anything, nothing broke, nothing was
 * revised, and then the thing existed: that is the shape this reads.
 *
 * WHAT IT IS NOT. Not a cheating detector, and nothing here returns a verdict about a child. It
 * counts events. A thin record has an innocent reading — a short task, or a child who worked without
 * logging — and the whole point of pairing it with a question is that asking is how you tell.
 *
 * It is also defeatable by logging fake attempts, and that hole is deliberately left open. Closing
 * it means surveillance or a classifier, and this repository refuses both on the evidence.
 */
import type { Project, WorkEvent } from "./model.js";

/**
 * How many events of real effort we expect to sit behind a finished artefact.
 *
 * OURS, NOT A FINDING. Two is the smallest number that can distinguish "tried, failed, fixed" from
 * "it appeared". Set higher and every genuinely small project trips it; lower and one stray attempt
 * clears a project nobody worked on. It is exposed so a pilot can move it once real projects exist,
 * because the right value is an empirical question nobody has answered.
 */
export const EFFORT_EXPECTED = 2;

/**
 * The event kinds that count as effort towards an artefact.
 *
 * `attempt` and `revision` are the direct evidence of iteration. `outcome` counts only when it is
 * `stuck`, because an outcome that went fine records a result rather than a struggle. `ai_help` is
 * deliberately NOT effort and deliberately not penalised either: declaring a model was used is
 * honesty we want to encourage, and a child who declares it and then iterates is doing the thing we
 * are asking for.
 */
const EFFORT_KINDS = new Set<WorkEvent["kind"]>(["attempt", "revision"]);

function isEffort(e: WorkEvent): boolean {
  return EFFORT_KINDS.has(e.kind) || (e.kind === "outcome" && e.stuck === true);
}

/** What stands behind one artefact, and whether that is thin. Never a verdict about the child. */
export interface Thinness {
  /** The artefact event this describes. */
  readonly artifactId: string;
  /** Attempts, revisions and stuck outcomes logged before it. */
  readonly effortBefore: number;
  /** Whether anything ever broke. A project where nothing went wrong is worth asking about. */
  readonly everStuck: boolean;
  /** Whether the child declared using a model. Recorded, never counted against them. */
  readonly declaredAiHelp: boolean;
  /** True when there is less effort behind this than `EFFORT_EXPECTED`. */
  readonly thin: boolean;
  /** One plain sentence for a guide. Describes the record, never the child. */
  readonly says: string;
}

/**
 * Read every artefact in a project against the work logged before it.
 *
 * Ordered by the event list rather than by timestamp: the journey is append-only, so its order is
 * the truth, and sorting by a client-supplied `at` would let a bad clock reorder history.
 */
export function thinnessOf(project: Project): readonly Thinness[] {
  const out: Thinness[] = [];
  let effort = 0;
  let stuck = false;
  let ai = false;

  for (const e of project.events) {
    if (isEffort(e)) effort += 1;
    if (e.kind === "outcome" && e.stuck === true) stuck = true;
    if (e.kind === "ai_help") ai = true;

    if (e.kind !== "artifact") continue;
    const thin = effort < EFFORT_EXPECTED;
    out.push({
      artifactId: e.id,
      effortBefore: effort,
      everStuck: stuck,
      declaredAiHelp: ai,
      thin,
      says: saysFor(effort, stuck),
    });
  }
  return out;
}

/** Whether anything in this project is worth asking the child about. */
export function hasThinArtifact(project: Project): boolean {
  return thinnessOf(project).some((t) => t.thin);
}

/**
 * The sentence a guide reads.
 *
 * Describes the RECORD and never the child, and offers the innocent reading in the same breath,
 * because a thin log genuinely means "short task, or worked without logging" as often as it means
 * anything else. A guide who reads this as an accusation has been misled by us.
 *
 * Exported because the guide console holds a stand-in for a project that carries these two counts
 * rather than the whole journey, and the wording is the sensitive part. A second copy of it over
 * there would drift, and the copy that drifts is the one that starts sounding like an accusation.
 */
export function saysFor(effort: number, stuck: boolean): string {
  const thin = effort < EFFORT_EXPECTED;
  if (!thin) {
    return stuck
      ? `${effort} pieces of work behind this, including something that broke.`
      : `${effort} pieces of work behind this.`;
  }
  if (effort === 0) {
    return "Nothing logged before this appeared. Either it was quick, or the work happened off the record.";
  }
  return `Only ${effort} piece of work behind this, and nothing broke along the way.`;
}
