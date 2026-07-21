"use client";

import { resolveMotion } from "@gt100k/cohort-arena-view";
import { motion } from "motion/react";

import { toMotionEasing } from "./hud/motion-transition";

interface StandingsToggleProps {
  readonly optedIn: boolean;
  readonly reducedMotion: boolean;
  readonly onToggle: () => void;
}

export function StandingsToggle({ optedIn, reducedMotion, onToggle }: StandingsToggleProps) {
  const toggle = resolveMotion("hudToggle", { reducedMotion });

  return (
    <motion.button
      type="button"
      aria-controls="standings-panel ledger-standings-state"
      aria-pressed={optedIn}
      data-motion-kind="hudToggle"
      data-motion-mode={toggle.mode}
      data-toggle-duration-ms={toggle.durationMs}
      data-toggle-easing={toggle.easing}
      whileTap={{ scale: 0.97 }}
      transition={{
        duration: toggle.durationMs / 1_000,
        ease: toMotionEasing(toggle.easing),
      }}
      onClick={onToggle}
    >
      Standings {optedIn ? "on" : "off"}
    </motion.button>
  );
}
