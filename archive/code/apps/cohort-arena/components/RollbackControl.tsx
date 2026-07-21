"use client";

import { resolveMotion } from "@gt100k/cohort-arena-view";
import { motion } from "motion/react";

import { toMotionEasing } from "./hud/motion-transition";

interface RollbackControlProps {
  readonly currentAssignmentId: string;
  readonly priorAssignmentId: string;
  readonly reducedMotion: boolean;
  readonly rolledBack: boolean;
  readonly onToggle: () => void;
}

export function RollbackControl({
  currentAssignmentId,
  priorAssignmentId,
  reducedMotion,
  rolledBack,
  onToggle,
}: RollbackControlProps) {
  const rollback = resolveMotion("rollback", { reducedMotion });
  const press = resolveMotion("press", { reducedMotion });

  return (
    <section className="rollback-control" aria-labelledby="rollback-heading">
      <div>
        <h3 id="rollback-heading">Snapshot preview</h3>
        <p>
          {rolledBack
            ? `Prior snapshot ${priorAssignmentId} shown.`
            : `Current snapshot ${currentAssignmentId} shown.`}{" "}
          <strong>Display only</strong> — the domain assignment remains unchanged.
        </p>
      </div>
      <motion.button
        type="button"
        aria-pressed={rolledBack}
        data-motion-kind={rollback.kind}
        data-motion-mode={rollback.mode}
        data-motion-duration={rollback.durationMs}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: press.durationMs / 1_000, ease: toMotionEasing(press.easing) }}
        onClick={onToggle}
      >
        <span aria-hidden="true">↶</span>
        {rolledBack
          ? `Return to current snapshot ${currentAssignmentId}`
          : `Preview rollback to ${priorAssignmentId}`}
      </motion.button>
      <output className="sr-only" aria-live="polite" aria-atomic="true">
        {rolledBack
          ? `Rolled back to ${priorAssignmentId} for presentation only.`
          : `Current snapshot ${currentAssignmentId} restored for presentation only.`}
      </output>
    </section>
  );
}
