"use client";

import { EASINGS, type ProbeCardView, resolveMotion } from "@gt100k/interest-lab-view";
import { motion } from "motion/react";
import type { CSSProperties, FocusEventHandler } from "react";
import { Glyph, type GlyphName, STATE_GLYPHS } from "../ui/Glyph";
import { WelcomeBack } from "./WelcomeBack";

const titleCase = (value: string) =>
  value.replaceAll("_", " ").replace(/^./, (c) => c.toUpperCase());

const cueGlyphs = {
  foundational: STATE_GLYPHS.explored,
  stretch: STATE_GLYPHS.new,
  solo: STATE_GLYPHS.support,
  group: "glyph-hands",
  audience: "glyph-speech",
  no_audience: STATE_GLYPHS.gap,
} as const satisfies Record<string, GlyphName>;

type MotionEasing = "linear" | readonly [number, number, number, number];

export function toMotionEasing(easing: string): MotionEasing {
  if (easing === "linear") return easing;
  const values = /^cubic-bezier\(([^,]+),([^,]+),([^,]+),([^,]+)\)$/.exec(easing);
  if (values === null) throw new Error(`Unsupported motion easing: ${easing}`);
  return values.slice(1).map(Number) as unknown as readonly [number, number, number, number];
}

export function resolveQuestCardMotion(reducedMotion: boolean, index: number) {
  const enter = resolveMotion("cardEnter", { reducedMotion });
  const stagger = resolveMotion("cardStagger", { reducedMotion });
  const hover = resolveMotion("hoverLift", { reducedMotion });
  const press = resolveMotion("press", { reducedMotion });
  const pick = resolveMotion("pick", { reducedMotion });

  return {
    enter: {
      initial: reducedMotion ? (false as const) : { opacity: 0, scale: 0.96 },
      transition: {
        delay: (stagger.durationMs * index) / 1000,
        duration: enter.durationMs / 1000,
        ease: enter.easing,
      },
    },
    hover: reducedMotion
      ? undefined
      : {
          transform: "translateY(-4px)",
          transition: { duration: hover.durationMs / 1000, ease: hover.easing },
        },
    press: {
      scale: 0.97,
      transition: { duration: press.durationMs / 1000, ease: press.easing },
    },
    pick: reducedMotion
      ? { duration: pick.durationMs / 1000, ease: pick.easing }
      : EASINGS.pickSpring,
  };
}

export interface QuestCardProps {
  quest: ProbeCardView;
  index: number;
  picked: boolean;
  onPick: (probeId: string) => void;
  onFocus?: FocusEventHandler<HTMLButtonElement>;
  touchTargetPx?: number;
}

export function QuestCard({
  quest,
  index,
  picked,
  onPick,
  onFocus,
  touchTargetPx = 48,
}: QuestCardProps) {
  const reducedMotion = quest.motion.mode === "reduced";
  const motionSpec = resolveQuestCardMotion(reducedMotion, index);
  const hover = motionSpec.hover
    ? {
        ...motionSpec.hover,
        transition: {
          ...motionSpec.hover.transition,
          ease: toMotionEasing(motionSpec.hover.transition.ease),
        },
      }
    : undefined;
  const press = {
    ...motionSpec.press,
    transition: {
      ...motionSpec.press.transition,
      ease: toMotionEasing(motionSpec.press.transition.ease),
    },
  };
  const enterTransition = {
    ...motionSpec.enter.transition,
    ease: toMotionEasing(motionSpec.enter.transition.ease),
  };
  const stateTransition =
    quest.returnState === "prompted-return"
      ? {
          duration: quest.motion.durationMs / 1000,
          ease: toMotionEasing(quest.motion.easing),
        }
      : enterTransition;
  const difficulty = titleCase(quest.difficulty);
  const social = titleCase(quest.social);
  const audience = quest.audience === "audience" ? "Audience" : "No audience";
  const returnState = quest.returnState === "new" ? "New quest" : titleCase(quest.returnState);
  const accessibleName = `${quest.title}. ${titleCase(quest.workMode)}. ${difficulty}. ${social}. ${audience}. ${quest.whyCopy}. ${returnState}.`;
  const style = {
    "--quest-hue": quest.domainHue,
    "--touch-target": `${touchTargetPx}px`,
  } as CSSProperties;

  return (
    <article className="quest-card-shell" style={style}>
      <motion.button
        type="button"
        className={`quest-card quest-card--${quest.tone}`}
        data-quest-card="true"
        data-probe-id={quest.probeId}
        data-return-state={quest.returnState}
        data-return-tone={quest.tone}
        aria-label={accessibleName}
        aria-pressed={picked}
        initial={motionSpec.enter.initial}
        animate={{
          opacity: quest.returnState === "prompted-return" ? 0.86 : 1,
          scale: 1,
          transform: "translateY(0)",
          filter: quest.returnState === "prompted-return" ? "saturate(0.62)" : "saturate(1)",
        }}
        whileHover={hover}
        whileTap={press}
        transition={stateTransition}
        onClick={() => onPick(quest.probeId)}
        onFocus={onFocus}
      >
        <span className="quest-card-topline">
          <span className="quest-work-glyph" data-glyph={quest.workModeGlyph} aria-hidden="true">
            <Glyph name={quest.workModeGlyph as GlyphName} />
          </span>
          <span className="quest-domain">{titleCase(quest.domain)}</span>
          <span className="quest-picked-state">{picked ? "In your tray" : "Choose quest"}</span>
        </span>
        <strong className="quest-title">{quest.title}</strong>
        <span className="quest-cues" aria-hidden="true">
          {(
            [
              [quest.difficulty, difficulty],
              [quest.social, social],
              [quest.audience, audience],
            ] as const
          ).map(([kind, text]) => (
            <span className="quest-cue" key={kind}>
              <Glyph name={cueGlyphs[kind]} size={16} />
              {text}
            </span>
          ))}
        </span>
        <span className="quest-provenance">
          {quest.provenance === "RULE"
            ? "Rules suggested this quest"
            : `${titleCase(quest.provenance)} suggestion`}
        </span>
        <WelcomeBack quest={quest} />
        {quest.returnState !== "voluntary-return" ? (
          <span className="quest-why">{quest.whyCopy}</span>
        ) : null}
      </motion.button>

      <details className="quest-help">
        <summary>
          <Glyph name={STATE_GLYPHS.help} size={18} />
          Try a different way
        </summary>
        <p>
          Ask for another version, extra support, or more time. Help never changes what you can
          choose.
        </p>
      </details>
    </article>
  );
}
