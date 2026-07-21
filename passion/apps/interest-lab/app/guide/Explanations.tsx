"use client";

import type { ExplanationCard, ExplanationsView } from "@gt100k/interest-lab-view";
import { motion } from "motion/react";
import { resolveGuideMotion, toMotionTransition } from "./motion";

const titleCase = (value: string) =>
  value.replaceAll("_", " ").replace(/^./, (character) => character.toUpperCase());

const uncertaintyCopy = (view: ExplanationsView): string => {
  if (view.uncertainty.kind === "grade") {
    return `Evidence grade: ${titleCase(view.uncertainty.grade)}`;
  }

  return `Evidence interval: ${view.uncertainty.lo} to ${view.uncertainty.hi}`;
};

interface ExplanationEvidenceProps {
  card: ExplanationCard;
}

function ExplanationEvidence({ card }: ExplanationEvidenceProps) {
  return (
    <details className="explanation-evidence">
      <summary>{card.evidenceRefs.length} linked evidence records</summary>
      {card.evidenceRefs.length > 0 ? (
        <ul>
          {card.evidenceRefs.map((evidenceRef) => (
            <li key={evidenceRef}>{evidenceRef}</li>
          ))}
        </ul>
      ) : (
        <p>This next test has no supporting record yet.</p>
      )}
    </details>
  );
}

interface ExplanationColumnProps {
  card: ExplanationCard;
  heading: string;
  evidenceRole: "supporting" | "disconfirming";
  reducedMotion: boolean;
}

function ExplanationColumn({ card, heading, evidenceRole, reducedMotion }: ExplanationColumnProps) {
  const motionSpec = resolveGuideMotion("explanationsReveal", reducedMotion);

  return (
    <motion.article
      className={`explanation-column explanation-column--${evidenceRole}`}
      data-explanation-role={evidenceRole}
      data-explanation-strength={card.strength}
      data-motion-kind={motionSpec.kind}
      initial={
        reducedMotion ? false : { opacity: 0.78, filter: "blur(4px)", clipPath: "inset(0 0 7% 0)" }
      }
      animate={{ opacity: 1, filter: "blur(0px)", clipPath: "inset(0 0 0% 0)" }}
      transition={toMotionTransition(motionSpec)}
    >
      <header>
        <h3>{heading}</h3>
        <span className="evidence-strength">{titleCase(card.strength)} evidence</span>
      </header>
      <p className="explanation-claim">{card.claim}</p>
      <ExplanationEvidence card={card} />
    </motion.article>
  );
}

export interface ExplanationsProps {
  view: ExplanationsView;
  reducedMotion: boolean;
}

export function Explanations({ view, reducedMotion }: ExplanationsProps) {
  const disconfirming =
    view.disconfirming ??
    ({
      claim: "Next test: gather evidence that could change the current explanation.",
      evidenceRefs: [],
      strength: view.supporting.strength,
      tone: "contested",
    } satisfies ExplanationCard);

  return (
    <section className="guide-section explanations" aria-labelledby="explanations-title">
      <header className="guide-section-heading">
        <div>
          <p className="guide-section-name">Competing explanations</p>
          <h2 id="explanations-title">Hold both accounts in view</h2>
        </div>
        <p className="uncertainty-copy">{uncertaintyCopy(view)}</p>
      </header>

      <div className="explanation-pair">
        <ExplanationColumn
          card={view.supporting}
          heading="Current evidence suggests"
          evidenceRole="supporting"
          reducedMotion={reducedMotion}
        />
        <ExplanationColumn
          card={disconfirming}
          heading="What else could explain this?"
          evidenceRole="disconfirming"
          reducedMotion={reducedMotion}
        />
      </div>

      {view.others.length > 0 ? (
        <details className="other-explanations">
          <summary>{view.others.length} other recorded explanation</summary>
          <ul>
            {view.others.map((card) => (
              <li key={card.claim}>{card.claim}</li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}
