import {
  type CohortArenaView,
  EASINGS,
  type MotionSpec,
  type Vec3,
  resolveMotion,
} from "@gt100k/cohort-arena-view";

export interface ObservatoryStar {
  readonly ref: string;
  readonly cohortIndex: number | null;
  readonly role: string | null;
  readonly state: "assigned" | "unassigned" | "candidate";
  readonly start: Vec3;
  readonly settled: Vec3;
}

export interface ObservatoryBadge {
  readonly cohortIndex: number;
  readonly constraint: string;
  readonly satisfied: boolean;
  readonly position: Vec3;
}

export interface ObservatoryFloorHalo {
  readonly cohortIndex: number;
  readonly position: Vec3;
  readonly radius: number;
  readonly minBenefit: number;
  readonly floor: number;
}

export interface ObservatorySceneModel {
  readonly stars: ObservatoryStar[];
  readonly badges: ObservatoryBadge[];
  readonly floorHalos: ObservatoryFloorHalo[];
  readonly caliperRadii: number[];
}

export interface ObservatoryMotion {
  readonly compile: MotionSpec;
  readonly rollback: MotionSpec;
  readonly drift: MotionSpec;
  readonly camera: MotionSpec;
}

type EasingName = keyof typeof EASINGS;

const BADGE_Y = 0.2;
const BADGE_RADIUS = 8.5;

const EASING_PATTERN = /^cubic-bezier\(([-\d.]+),([-\d.]+),([-\d.]+),([-\d.]+)\)$/;
const easingPointCache = new Map<EasingName, readonly [number, number, number, number]>();

function easingPoints(easing: EasingName): readonly [number, number, number, number] {
  const cached = easingPointCache.get(easing);
  if (cached) return cached;

  const token = EASINGS[easing];
  if (token === "linear") return [0, 0, 1, 1];
  const match = EASING_PATTERN.exec(token);
  if (!match) throw new Error(`Invalid easing token: ${token}`);
  const points = [Number(match[1]), Number(match[2]), Number(match[3]), Number(match[4])] as const;
  easingPointCache.set(easing, points);
  return points;
}

function round3(value: number): number {
  const rounded = Math.round(value * 1_000) / 1_000;
  return Object.is(rounded, -0) ? 0 : rounded;
}

function bezierCoordinate(time: number, first: number, second: number): number {
  const inverse = 1 - time;
  return 3 * inverse * inverse * time * first + 3 * inverse * time * time * second + time ** 3;
}

function bezierSlope(time: number, first: number, second: number): number {
  const inverse = 1 - time;
  return (
    3 * inverse * inverse * first +
    6 * inverse * time * (second - first) +
    3 * time * time * (1 - second)
  );
}

function solveCurveTime(progress: number, firstX: number, secondX: number): number {
  let time = progress;

  for (let iteration = 0; iteration < 6; iteration += 1) {
    const error = bezierCoordinate(time, firstX, secondX) - progress;
    const slope = bezierSlope(time, firstX, secondX);
    if (Math.abs(error) < 0.000_001) return time;
    if (Math.abs(slope) < 0.000_001) break;
    time -= error / slope;
    if (time < 0 || time > 1) break;
  }

  let lower = 0;
  let upper = 1;
  time = progress;
  for (let iteration = 0; iteration < 12; iteration += 1) {
    const sample = bezierCoordinate(time, firstX, secondX);
    if (Math.abs(sample - progress) < 0.000_001) break;
    if (sample < progress) lower = time;
    else upper = time;
    time = (lower + upper) / 2;
  }
  return time;
}

/** Resolves the CSS cubic-bezier token for a normalized r3f frame progress. */
export function easeSceneProgress(easing: EasingName, progress: number): number {
  const bounded = Math.min(1, Math.max(0, progress));
  if (bounded === 0 || bounded === 1 || easing === "linear") return bounded;

  const [firstX, firstY, secondX, secondY] = easingPoints(easing);
  const time = solveCurveTime(bounded, firstX, secondX);
  const eased = bezierCoordinate(time, firstY, secondY);
  return Math.min(easing === "settle" ? 1.04 : 1, Math.max(0, eased));
}

export function resolveObservatoryMotion(view: CohortArenaView): ObservatoryMotion {
  const reducedMotion = view.motion.compile.mode === "reduced";
  return {
    compile: resolveMotion("compile", { reducedMotion }),
    rollback: resolveMotion("rollback", { reducedMotion }),
    drift: resolveMotion("ambientDrift", { reducedMotion }),
    camera: resolveMotion("cameraEase", { reducedMotion }),
  };
}

export function buildObservatoryScene(view: CohortArenaView): ObservatorySceneModel {
  const assignedStars = view.constellation.hexes.flatMap((hex) =>
    hex.members.map(
      (member): ObservatoryStar => ({
        ref: member.ref,
        cohortIndex: hex.cohortIndex,
        role: member.role,
        state: member.state,
        start: member.field ?? member.pos,
        settled: member.pos,
      }),
    ),
  );
  const benchStars = view.constellation.bench.map(
    (member): ObservatoryStar => ({
      ref: member.ref,
      cohortIndex: null,
      role: member.role,
      state: member.state,
      start: member.field ?? member.pos,
      settled: member.pos,
    }),
  );
  const badges = view.cohorts.flatMap((cohort) => {
    const hex = view.constellation.hexes.find(
      ({ cohortIndex }) => cohortIndex === cohort.cohortIndex,
    );
    if (!hex) return [];

    return cohort.badges.map((badge, badgeIndex): ObservatoryBadge => {
      const angle = ((90 - badgeIndex * (360 / cohort.badges.length)) * Math.PI) / 180;
      return {
        cohortIndex: cohort.cohortIndex,
        constraint: badge.constraint,
        satisfied: badge.satisfied,
        position: {
          x: round3(hex.center.x + BADGE_RADIUS * Math.cos(angle)),
          y: BADGE_Y,
          z: round3(hex.center.z + BADGE_RADIUS * Math.sin(angle)),
        },
      };
    });
  });
  const floorHalos = view.constellation.hexes.flatMap((hex): ObservatoryFloorHalo[] => {
    const cohort = view.cohorts.find(({ cohortIndex }) => cohortIndex === hex.cohortIndex);
    if (!cohort) return [];
    return [
      {
        cohortIndex: hex.cohortIndex,
        position: hex.floorHalo.pos,
        radius: hex.floorHalo.radius,
        minBenefit: cohort.nonHarmFloor.minBenefit,
        floor: cohort.nonHarmFloor.floor,
      },
    ];
  });

  return {
    stars: [...assignedStars, ...benchStars],
    badges,
    floorHalos,
    caliperRadii: [...view.constellation.caliperRadii],
  };
}
