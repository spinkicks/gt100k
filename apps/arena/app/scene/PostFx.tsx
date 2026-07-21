"use client";

import { type InitialArenaView, LAMBDAS, celebrationMotionSpec } from "@gt100k/arena-world";
import { useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer, SMAA, Vignette } from "@react-three/postprocessing";
import { type ElementRef, type ReactElement, useEffect, useMemo, useRef } from "react";
import type { SequencedArenaFeedback } from "./feedback";
import { resolveArenaFeedback } from "./feedback";

interface BloomHandle {
  intensity: number;
}

export interface PostFxPlan {
  enabled: boolean;
  bloom: {
    threshold: number;
    baselineIntensity: number;
    peakIntensity: number;
    radius: number;
    mipmapBlur: boolean;
  } | null;
  vignette: { offset: number; darkness: number } | null;
  smaa: boolean;
  pulseDelayMs: number;
  pulseDurationMs: number;
}

export function dampScalar(current: number, target: number, lambda: number, delta: number): number {
  return current + (target - current) * (1 - Math.exp(-lambda * delta));
}

export function buildPostFxPlan(
  view: InitialArenaView,
  feedbackInput?: SequencedArenaFeedback,
): PostFxPlan {
  const config = view.presentation.postfx;
  const feedback = feedbackInput ? resolveArenaFeedback(feedbackInput.signal) : null;
  const motion =
    feedback?.event === null || feedback?.event === undefined
      ? null
      : celebrationMotionSpec(feedback.event, { reducedMotion: view.flags.reducedMotion });
  const enabled =
    !view.flags.reducedMotion && (config.bloom !== null || config.vignette !== null || config.smaa);

  if (!enabled) {
    return {
      enabled: false,
      bloom: null,
      vignette: null,
      smaa: false,
      pulseDelayMs: 0,
      pulseDurationMs: 0,
    };
  }

  return {
    enabled: true,
    bloom: config.bloom
      ? {
          threshold: config.bloom.threshold,
          baselineIntensity: config.bloom.intensity,
          peakIntensity: motion?.bloomPeak ?? config.bloom.intensity,
          radius: config.bloom.radius,
          mipmapBlur: config.bloom.mipmapBlur,
        }
      : null,
    vignette: config.vignette ? { ...config.vignette } : null,
    smaa: config.smaa,
    pulseDelayMs:
      feedback?.event?.type === "independent-unlock" && feedback.event.intensity === "high"
        ? 120
        : 0,
    pulseDurationMs: motion?.durationMs ?? 0,
  };
}

export interface PostFxProps {
  view: InitialArenaView;
  feedback?: SequencedArenaFeedback;
}

export default function PostFx({ view, feedback }: PostFxProps) {
  const plan = useMemo(() => buildPostFxPlan(view, feedback), [feedback, view]);
  const bloomRef = useRef<ElementRef<typeof Bloom>>(null);
  const pulseElapsedMs = useRef(plan.pulseDurationMs);
  const peakIntensity = useRef(plan.bloom?.peakIntensity ?? 0.7);
  const activeSequence = useRef(0);
  const feedbackSequence = feedback?.sequence ?? 0;

  useEffect(() => {
    activeSequence.current = feedbackSequence;
    pulseElapsedMs.current = 0;
    peakIntensity.current = plan.bloom?.peakIntensity ?? 0.7;
  }, [feedbackSequence, plan.bloom?.peakIntensity]);

  useFrame((_, delta) => {
    const bloom = bloomRef.current as unknown as BloomHandle | null;
    const config = plan.bloom;
    if (!bloom || !config) return;

    pulseElapsedMs.current += delta * 1_000;
    const rising =
      activeSequence.current > 0 &&
      plan.pulseDurationMs > 0 &&
      pulseElapsedMs.current >= plan.pulseDelayMs &&
      pulseElapsedMs.current < plan.pulseDelayMs + plan.pulseDurationMs * 0.4;
    const target = rising ? peakIntensity.current : config.baselineIntensity;
    bloom.intensity = dampScalar(bloom.intensity, target, LAMBDAS.bloomPulse, delta);
  });

  if (!plan.enabled) return null;

  const effects: ReactElement[] = [];
  if (plan.bloom) {
    effects.push(
      <Bloom
        ref={bloomRef}
        intensity={plan.bloom.baselineIntensity}
        key="bloom"
        luminanceThreshold={plan.bloom.threshold}
        mipmapBlur={plan.bloom.mipmapBlur}
        radius={plan.bloom.radius}
      />,
    );
  }
  if (plan.vignette) {
    effects.push(
      <Vignette darkness={plan.vignette.darkness} key="vignette" offset={plan.vignette.offset} />,
    );
  }
  if (plan.smaa) effects.push(<SMAA key="smaa" />);

  return <EffectComposer multisampling={0}>{effects}</EffectComposer>;
}
