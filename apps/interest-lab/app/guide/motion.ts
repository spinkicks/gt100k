import { MOTION, resolveMotion } from "@gt100k/interest-lab-view";

export type GuideMotionKind =
  | "explanationsReveal"
  | "timelineDraw"
  | "markerPop"
  | "stateMorph"
  | "gateCheck";

export type MotionEasing = "linear" | readonly [number, number, number, number];

export interface GuideMotionSpec {
  kind: GuideMotionKind;
  durationMs: number;
  delayMs: number;
  easing: string;
}

const STAGGERED_KINDS = new Set<GuideMotionKind>(["markerPop", "gateCheck"]);

export function resolveGuideMotion(
  kind: GuideMotionKind,
  reducedMotion: boolean,
  index = 0,
): GuideMotionSpec {
  const token = resolveMotion(kind, { reducedMotion });

  return {
    kind,
    durationMs: token.durationMs,
    delayMs: reducedMotion || !STAGGERED_KINDS.has(kind) ? 0 : MOTION.stagger * index,
    easing: token.easing,
  };
}

export function toMotionEasing(easing: string): MotionEasing {
  if (easing === "linear") return easing;
  const values = /^cubic-bezier\(([^,]+),([^,]+),([^,]+),([^,]+)\)$/.exec(easing);
  if (values === null) throw new Error(`Unsupported guide motion easing: ${easing}`);
  return values.slice(1).map(Number) as unknown as readonly [number, number, number, number];
}

export function toMotionTransition(spec: GuideMotionSpec) {
  return {
    duration: spec.durationMs / 1000,
    delay: spec.delayMs / 1000,
    ease: toMotionEasing(spec.easing),
  };
}
