import { EASINGS, type MotionSpec } from "@gt100k/cohort-arena-view";

type MotionEasing = "linear" | [number, number, number, number];

const CUBIC_BEZIER = /^cubic-bezier\(([^,]+),([^,]+),([^,]+),([^,]+)\)$/;

export function toMotionEasing(name: MotionSpec["easing"]): MotionEasing {
  const value = EASINGS[name];
  if (value === "linear") return value;

  const points = CUBIC_BEZIER.exec(value);
  if (!points) throw new Error(`Unsupported motion easing: ${value}`);

  return [Number(points[1]), Number(points[2]), Number(points[3]), Number(points[4])];
}
