"use client";

/**
 * The question that appears when an artefact turns up with nothing behind it.
 *
 * It is not a gate. The child can close it, ignore it, and carry on; the artefact is already logged
 * and stays logged. What it produces is a `reflection` entry in the same journey as everything else,
 * which a guide can read beside the thing it is about.
 *
 * THE COPY IS A DESIGN CONSTRAINT, not decoration. Per
 * `docs/decisions/2026-08-04-mid-project-interview.md` §3 the child is never told they are suspected
 * of anything: a false positive otherwise teaches a child who did the work that a machine thinks
 * they cheated, and our own research records that cheating-accusation anxiety rises with grade
 * level. So the framing is interest, the dismissal is free, and nothing on this panel says why it
 * appeared.
 */
import { useState, type JSX } from "react";

import type { PendingQuestion } from "./interview.js";

export function InterviewPanel({
  pending,
  onAnswer,
  onSkip,
}: {
  pending: PendingQuestion;
  onAnswer: (answer: string) => void;
  onSkip: () => void;
}): JSX.Element {
  const [answer, setAnswer] = useState("");
  const canSend = answer.trim().length > 0;

  return (
    <section className="interview" aria-label="A question about your work">
      <p className="interview__q">{pending.question}</p>
      <textarea
        className="interview__in"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="However you'd say it out loud."
        rows={3}
        aria-label="Your answer"
      />
      <div className="interview__row">
        <button
          type="button"
          className="btn btn--add"
          disabled={!canSend}
          onClick={() => canSend && onAnswer(answer)}
        >
          Send
        </button>
        {/* Free, and worded as a choice rather than a refusal. A child who does not want to answer
            has not failed anything, and the artefact is already saved either way. */}
        <button type="button" className="btn btn--interview-skip" onClick={onSkip}>
          Not now
        </button>
      </div>
    </section>
  );
}
