"use client";

import { type MotionSpec, type StandingsView, resolveMotion } from "@gt100k/cohort-arena-view";
import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { useEffect } from "react";

import { toMotionEasing } from "./motion-transition";

interface StandingsPanelProps {
  readonly standings: StandingsView | null;
  readonly reducedMotion: boolean;
}

interface AnimatedGainProps {
  readonly target: number;
  readonly motionSpec: MotionSpec;
}

function transitionFor(spec: MotionSpec) {
  return {
    duration: spec.durationMs / 1_000,
    ease: toMotionEasing(spec.easing),
  };
}

function signedGain(gain: number): string {
  return gain >= 0 ? `+${gain}` : `−${Math.abs(gain)}`;
}

function fillScale(standings: StandingsView): number {
  const bandTop = Math.max(0, standings.selfGain + standings.gainToBandTop);
  if (bandTop === 0) return 0;
  return Math.min(1, Math.max(0, standings.selfGain / bandTop));
}

function AnimatedGain({ target, motionSpec }: AnimatedGainProps) {
  const gain = useMotionValue(motionSpec.durationMs === 0 ? target : 0);
  const roundedGain = useTransform(gain, (latest) => Math.round(latest).toString());

  useEffect(() => {
    if (motionSpec.durationMs === 0) {
      gain.set(target);
      return;
    }

    gain.set(0);
    const playback = animate(gain, target, transitionFor(motionSpec));
    return () => playback.stop();
  }, [gain, motionSpec, target]);

  return <motion.span aria-hidden="true">{roundedGain}</motion.span>;
}

export function StandingsPanel({ standings, reducedMotion }: StandingsPanelProps) {
  if (!standings) return null;

  const bar = resolveMotion("standingsBar", { reducedMotion });
  const celebration = resolveMotion("gainCelebrate", { reducedMotion });
  const scale = fillScale(standings);
  const finalTransform = `scaleX(${scale})`;

  return (
    <section
      className="standings-panel"
      aria-labelledby="standings-heading"
      data-standings-panel="own-growth"
      data-self-gain={standings.selfGain}
      data-gain-to-band-top={standings.gainToBandTop}
      data-motion-mode={bar.mode}
      data-bar-duration-ms={bar.durationMs}
      data-bar-easing={bar.easing}
      data-celebrate-duration-ms={celebration.durationMs}
      data-celebrate-easing={celebration.easing}
    >
      <header className="standings-header">
        <div>
          <p className="standings-context">Opt-in near-peer view</p>
          <h3 id="standings-heading">Sprint growth</h3>
        </div>
        <motion.span
          className="standings-gain-chip"
          initial={reducedMotion ? false : { opacity: 0.75, transform: "scale(0.98)" }}
          animate={{ opacity: 1, transform: "scale(1)" }}
          transition={transitionFor(celebration)}
        >
          Own growth
        </motion.span>
      </header>

      <div className="standings-own-gain">
        <p>Your own gain this sprint</p>
        <p className="standings-value">
          <span className="sr-only">Own gain {standings.selfGain}</span>
          <AnimatedGain target={standings.selfGain} motionSpec={bar} />
          <span aria-hidden="true"> points</span>
        </p>
      </div>

      <div
        className="standings-bar-track"
        role="img"
        aria-label={`Own gain ${standings.selfGain}; ${standings.gainToBandTop} to the near-peer band top`}
      >
        <motion.div
          className="standings-bar-fill"
          initial={reducedMotion ? false : { transform: "scaleX(0)" }}
          animate={{ transform: finalTransform }}
          transition={transitionFor(bar)}
        />
      </div>

      <p className="standings-headroom">
        <strong>{standings.gainToBandTop}</strong> to the near-peer band top
      </p>

      <div className="standings-peer-context">
        <p>Near-peer sprint context</p>
        <ul aria-label="Pseudonymous near-peer gains">
          {standings.anonymizedPeers.map((peer) => (
            <li
              key={`${peer.pseudonym}:${peer.gain}`}
              data-peer-pseudonym={peer.pseudonym}
              data-peer-gain={peer.gain}
            >
              <span>{peer.pseudonym}</span>
              <data value={peer.gain}>{signedGain(peer.gain)}</data>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
