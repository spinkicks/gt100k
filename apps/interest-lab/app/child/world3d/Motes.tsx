"use client";

import { PALETTE, type QualityTier, type Vector3 } from "@gt100k/interest-lab-view";
import { Sparkles } from "@react-three/drei";

export interface MotesProps {
  quality: QualityTier;
}

export interface MotesRenderProps {
  count: number;
  color: string;
  size: number;
  speed: number;
  scale: Vector3;
}

export function resolveMotesProps(quality: Readonly<QualityTier>): MotesRenderProps | null {
  if (quality.motes === 0) return null;

  return {
    count: quality.motes,
    color: PALETTE.sparkHi,
    size: 2,
    speed: 0.3,
    scale: [26, 10, 26],
  };
}

export function Motes({ quality }: MotesProps) {
  const props = resolveMotesProps(quality);
  return props ? <Sparkles {...props} /> : null;
}
