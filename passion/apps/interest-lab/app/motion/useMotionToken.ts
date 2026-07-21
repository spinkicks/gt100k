"use client";

import { resolveMotion } from "@gt100k/interest-lab-view";
import { useReducedMotion } from "motion/react";

type MotionKind = Parameters<typeof resolveMotion>[0];

export function useMotionToken(kind: MotionKind) {
  const prefersReducedMotion = useReducedMotion();

  return resolveMotion(kind, { reducedMotion: prefersReducedMotion === true });
}
