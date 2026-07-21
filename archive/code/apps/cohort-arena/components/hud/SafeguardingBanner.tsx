import { STATE_CUES, type SafeguardingView, resolveMotion } from "@gt100k/cohort-arena-view";
import { motion } from "motion/react";

import { toMotionEasing } from "./motion-transition";

interface SafeguardingBannerProps {
  readonly safeguarding: SafeguardingView;
  readonly reducedMotion: boolean;
}

export function SafeguardingBanner({ safeguarding, reducedMotion }: SafeguardingBannerProps) {
  if (!safeguarding.optimizationBypassed) return null;

  const sweep = resolveMotion("safeguardSweep", { reducedMotion });
  const pausedCount = safeguarding.pausedMoves.length;
  const lane = safeguarding.pending[0]?.safeguardingLink ?? "human safeguarding queue";

  return (
    <section
      className="safeguarding-banner"
      aria-labelledby="safeguarding-banner-heading"
      data-safeguarding-state="optimization-bypassed"
      data-state-icon={STATE_CUES.paused.icon}
      data-motion-kind={sweep.kind}
      data-motion-mode={sweep.mode}
      data-motion-duration-ms={sweep.durationMs}
      data-motion-easing={sweep.easing}
    >
      <motion.span
        className="safeguarding-sweep"
        aria-hidden="true"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{
          duration: sweep.durationMs / 1_000,
          ease: toMotionEasing(sweep.easing),
        }}
      />
      <div className="safeguarding-banner-mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false">
          <title>Safeguarding shield</title>
          <path d="M12 2.5 20 6v5.5c0 4.9-3.4 8.2-8 10-4.6-1.8-8-5.1-8-10V6l8-3.5Z" />
          <path d="m8.7 12 2.1 2.1 4.7-5" />
        </svg>
      </div>
      <div className="safeguarding-banner-copy">
        <p className="safeguarding-lane">Safeguarding lane</p>
        <h3 id="safeguarding-banner-heading">Optimization bypassed</h3>
        <p>
          {pausedCount} conflicting {pausedCount === 1 ? "move" : "moves"} paused. Routed to {lane}.
        </p>
        <ul aria-label="Paused cohort moves">
          {safeguarding.pausedMoves.map((move) => (
            <li key={move.moveId} data-paused-move={move.moveId}>
              <strong>{move.moveId}</strong>
              <span>{move.touches.join(", ")}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
