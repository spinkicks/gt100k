import type { ProjectProfile, ReadinessLevel, Session, Turn, Facet } from "./model.js";
import { maxFollowup } from "./model.js";
import type { TutorPorts } from "./ports.js";
import { initialCoverage, updateCoverage, selectNextFacet, isComplete, computeGaps } from "./scaffold.js";

// Supplies the child's answer each turn. In production this comes from the live UI; in CI it
// replays a recorded array. This is the spec §5 `answerSource` (NOT a pre-known answers[]), so the
// same engine drives a live LLM interview and a deterministic replay.
export type AnswerSource = (ctx: {
  profile: ProjectProfile;
  facet: Facet;
  question: string;
  isFollowUp: boolean;
  index: number;
  readinessLevel: ReadinessLevel;
}) => Promise<string>;

export interface RunSessionInput {
  profile: ProjectProfile;
  readinessLevel: ReadinessLevel;
  ports: TutorPorts;
  answerSource: AnswerSource;
}

export async function runSession(input: RunSessionInput): Promise<Session> {
  const { profile, readinessLevel, ports, answerSource } = input;
  const cap = maxFollowup(readinessLevel);

  let cov = initialCoverage();
  const turns: Turn[] = [];
  const followups: Record<string, number> = {};
  let targetFacet: Facet = selectNextFacet(cov);
  let isFollowUp = false;

  // isComplete bounds the loop via MAX_TURNS, so there is no unbounded interview.
  while (!isComplete(cov, turns.length)) {
    const idx = turns.length;
    const question = await ports.interviewer.nextQuestion({
      profile,
      transcript: turns,
      targetFacet,
      isFollowUp,
      readinessLevel,
    });
    const answer = await answerSource({
      profile,
      facet: targetFacet,
      question,
      isFollowUp,
      index: idx,
      readinessLevel,
    });
    const judgment = await ports.judge.judge({
      profile,
      facet: targetFacet,
      question,
      answer,
      readinessLevel,
    });

    cov = updateCoverage(cov, targetFacet, judgment.coverage);
    turns.push({ index: idx, facet: targetFacet, question, isFollowUp, answer, coverage: cov[targetFacet] });

    if (isComplete(cov, turns.length)) break;

    const used = followups[targetFacet] ?? 0;
    if (judgment.thin && used < cap) {
      followups[targetFacet] = used + 1;
      isFollowUp = true; // re-probe same facet
    } else {
      isFollowUp = false;
      targetFacet = selectNextFacet(cov);
    }
  }

  return {
    profile,
    readinessLevel,
    turns,
    coverageByFacet: cov,
    gaps: computeGaps(cov),
    status: "complete",
  };
}
