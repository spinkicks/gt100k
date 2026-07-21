import { type CohortArenaView, type MotionSpec, resolveMotion } from "@gt100k/cohort-arena-view";
import { motion } from "motion/react";

import { toMotionEasing } from "./motion-transition";

interface CohortRosterHudProps {
  readonly view: CohortArenaView;
  readonly reducedMotion: boolean;
}

const CONSTRAINT_LABELS: Readonly<Record<string, string>> = {
  age: "Age band",
  schedule: "Schedule",
  "safeguarding-separation": "Safeguarding separation",
  accommodations: "Accommodations",
  "level-velocity-caliper": "Level + velocity caliper",
  "individual-non-harm-floor": "Individual non-harm floor",
  "churn-budget": "Churn budget",
};

function constraintLabel(constraint: string): string {
  return CONSTRAINT_LABELS[constraint] ?? constraint.replaceAll("-", " ");
}

function layoutTransition(spec: MotionSpec) {
  return {
    duration: spec.durationMs / 1_000,
    ease: toMotionEasing(spec.easing),
  };
}

export function CohortRosterHud({ view, reducedMotion }: CohortRosterHudProps) {
  const memberSwap = resolveMotion("memberSwap", { reducedMotion });
  const transition = { layout: layoutTransition(memberSwap) };

  return (
    <div className="cohort-roster" aria-label="Accepted cohort rosters">
      {view.cohorts.map((cohort) => {
        const headingId = `cohort-roster-${cohort.cohortIndex + 1}`;

        return (
          <motion.article
            className="cohort-roster-card translucent"
            key={cohort.cohortIndex}
            layout
            transition={transition}
            aria-labelledby={headingId}
            data-cohort-card="accepted"
            data-motion-kind={memberSwap.kind}
            data-motion-mode={memberSwap.mode}
            data-layout-duration-ms={memberSwap.durationMs}
            data-layout-easing={memberSwap.easing}
          >
            <header className="cohort-roster-card-header">
              <div>
                <h3 id={headingId}>Cohort {cohort.cohortIndex + 1}</h3>
                <p>{cohort.members.length} members · settled formation</p>
              </div>
              <span className="cohort-accepted-state">
                <span aria-hidden="true">✓</span>
                Accepted
              </span>
            </header>

            <ul
              className="cohort-member-list"
              aria-label={`Cohort ${cohort.cohortIndex + 1} roster`}
            >
              {cohort.members.map((member) => (
                <motion.li
                  key={member.ref}
                  layout
                  transition={transition}
                  data-member-ref={member.ref}
                  data-role={member.role}
                >
                  <span className="cohort-member-mark" aria-hidden="true" />
                  <span>
                    <strong>{member.ref}</strong>
                    <small>{member.role}</small>
                  </span>
                </motion.li>
              ))}
            </ul>

            <ul
              className="cohort-constraint-list"
              aria-label={`Cohort ${cohort.cohortIndex + 1} hard constraints`}
            >
              {cohort.badges.map((badge) => (
                <li key={badge.constraint} data-constraint-state="satisfied">
                  <span className="cohort-constraint-mark" aria-hidden="true">
                    ✓
                  </span>
                  <span>{constraintLabel(badge.constraint)}</span>
                  <small>Satisfied</small>
                </li>
              ))}
            </ul>

            <p className="cohort-floor-readout">
              <span className="cohort-floor-mark" aria-hidden="true">
                ◎
              </span>
              Non-harm floor {cohort.nonHarmFloor.minBenefit} ≥ {cohort.nonHarmFloor.floor}
            </p>
          </motion.article>
        );
      })}
    </div>
  );
}
