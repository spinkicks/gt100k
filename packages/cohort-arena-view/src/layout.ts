import type { CohortAssignment, LearnerProfile, Role } from "../../cohort-compiler/src/index.js";

export interface Vec2 {
  readonly x: number;
  readonly y: number;
}

export interface Vec3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface MoteView {
  readonly ref: string;
  readonly pos: Vec3;
  readonly pos2d: Vec2;
  readonly field: Vec3 | null;
  readonly state: "assigned" | "unassigned" | "candidate";
  readonly role: Role | null;
}

export interface CohortHexView {
  readonly cohortIndex: number;
  readonly center: Vec3;
  readonly center2d: Vec2;
  readonly floorHalo: {
    readonly pos: Vec3;
    readonly radius: number;
  };
  readonly members: MoteView[];
}

export interface ConstellationView {
  readonly world: { readonly width: number; readonly height: number };
  readonly camera: {
    readonly position: Vec3;
    readonly target: Vec3;
    readonly fov: number;
    readonly near: number;
    readonly far: number;
  };
  readonly fog: { readonly color: string; readonly near: number; readonly far: number };
  readonly hexes: CohortHexView[];
  readonly bench: MoteView[];
  readonly caliperRadii: number[];
}

export interface SeatLayout {
  readonly speaker: string;
  readonly pos: Vec3;
  readonly pos2d: Vec2;
}

export const LAYOUT = {
  WORLD: { width: 1600, height: 900 },
  CAMERA: {
    position: { x: 0, y: 26, z: 46 },
    target: { x: 0, y: 0, z: -6 },
    fov: 42,
    near: 0.1,
    far: 400,
  },
  FOG: { color: "#0B1220", near: 40, far: 120 },
  HEX_R: 6,
  COHORT_ORIGIN: { x: -11, y: 0, z: 0 },
  COL_W: 22,
  ROW_D: 22,
  COHORT_COLS: 2,
  FLOOR_Y: -1.5,
  FLOOR_R: 8,
  BADGE_R: 8.5,
  BENCH_Y: -8,
  BENCH_Z: 18,
  BENCH_X0: -20,
  BENCH_DX: 5,
  FIELD_STEP: 2.5,
  FIELD_REF: { level: 11, velocity: 11 },
  CALIPER_RADII: [5, 10, 15],
  RING_CENTER: { x: 0, y: 0, z: 0 },
  RING_R: 10,
  PROJECT: { scale: 24, cx: 800, cy: 450 },
} as const;

function round3(value: number): number {
  const rounded = Math.round(value * 1_000) / 1_000;
  return Object.is(rounded, -0) ? 0 : rounded;
}

function compareRefs(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

export function center(index: number): Vec3 {
  return {
    x: LAYOUT.COHORT_ORIGIN.x + (index % LAYOUT.COHORT_COLS) * LAYOUT.COL_W,
    y: LAYOUT.COHORT_ORIGIN.y,
    z: LAYOUT.COHORT_ORIGIN.z - Math.floor(index / LAYOUT.COHORT_COLS) * LAYOUT.ROW_D,
  };
}

export function vertexLocal(index: number): Vec3 {
  const angleRadians = ((90 - index * 60) * Math.PI) / 180;
  return {
    x: round3(LAYOUT.HEX_R * Math.cos(angleRadians)),
    y: 0,
    z: round3(LAYOUT.HEX_R * Math.sin(angleRadians)),
  };
}

export function benchSlot(index: number): Vec3 {
  return {
    x: LAYOUT.BENCH_X0 + index * LAYOUT.BENCH_DX,
    y: LAYOUT.BENCH_Y,
    z: LAYOUT.BENCH_Z,
  };
}

export function project2D(position: Vec3): Vec2 {
  return {
    x: Math.round(LAYOUT.PROJECT.cx + position.x * LAYOUT.PROJECT.scale),
    y: Math.round(LAYOUT.PROJECT.cy - position.z * LAYOUT.PROJECT.scale),
  };
}

export function layoutField(pool: readonly LearnerProfile[]): Map<string, Vec3> {
  return new Map(
    [...pool]
      .sort((left, right) => compareRefs(left.learnerRef, right.learnerRef))
      .map((learner) => [
        learner.learnerRef,
        {
          x: round3((learner.level - LAYOUT.FIELD_REF.level) * LAYOUT.FIELD_STEP),
          y: 0,
          z: round3((learner.velocity - LAYOUT.FIELD_REF.velocity) * LAYOUT.FIELD_STEP),
        },
      ]),
  );
}

export function layoutConstellation(
  assignment: CohortAssignment,
  pool: readonly LearnerProfile[] = [],
): ConstellationView {
  const fieldByRef = layoutField(pool);
  const assignedRefs = new Set(
    assignment.cohorts.flatMap((cohort) => cohort.members.map(({ ref }) => ref)),
  );
  const hexes = assignment.cohorts.map((cohort, cohortIndex): CohortHexView => {
    const hexCenter = center(cohortIndex);
    const members = [...cohort.members]
      .sort((left, right) => compareRefs(left.ref, right.ref))
      .map((member, memberIndex): MoteView => {
        const local = vertexLocal(memberIndex);
        const pos = {
          x: round3(hexCenter.x + local.x),
          y: round3(hexCenter.y + local.y),
          z: round3(hexCenter.z + local.z),
        };

        return {
          ref: member.ref,
          pos,
          pos2d: project2D(pos),
          field: fieldByRef.get(member.ref) ?? null,
          state: "assigned",
          role: member.role as Role,
        };
      });

    return {
      cohortIndex,
      center: hexCenter,
      center2d: project2D(hexCenter),
      floorHalo: {
        pos: { x: hexCenter.x, y: LAYOUT.FLOOR_Y, z: hexCenter.z },
        radius: LAYOUT.FLOOR_R,
      },
      members,
    };
  });

  const bench = [...pool]
    .filter(({ learnerRef }) => !assignedRefs.has(learnerRef))
    .sort((left, right) => compareRefs(left.learnerRef, right.learnerRef))
    .map((learner, index): MoteView => {
      const pos = benchSlot(index);
      return {
        ref: learner.learnerRef,
        pos,
        pos2d: project2D(pos),
        field: fieldByRef.get(learner.learnerRef) ?? null,
        state: "unassigned",
        role: null,
      };
    });

  return {
    world: LAYOUT.WORLD,
    camera: LAYOUT.CAMERA,
    fog: LAYOUT.FOG,
    hexes,
    bench,
    caliperRadii: [...LAYOUT.CALIPER_RADII],
  };
}

export function layoutArenaRing(speakers: readonly string[]): SeatLayout[] {
  const ordered = [...speakers].sort(compareRefs);
  if (ordered.length === 0) return [];

  return ordered.map((speaker, index) => {
    const angleRadians = ((90 - index * (360 / ordered.length)) * Math.PI) / 180;
    const pos = {
      x: round3(LAYOUT.RING_CENTER.x + LAYOUT.RING_R * Math.cos(angleRadians)),
      y: LAYOUT.RING_CENTER.y,
      z: round3(LAYOUT.RING_CENTER.z + LAYOUT.RING_R * Math.sin(angleRadians)),
    };
    return { speaker, pos, pos2d: project2D(pos) };
  });
}
