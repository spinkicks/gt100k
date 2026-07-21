import { describe, expect, it } from "vitest";

import type { CohortAssignment, LearnerProfile, Role } from "../../cohort-compiler/src/index.js";
import {
  LAYOUT,
  benchSlot,
  center,
  layoutArenaRing,
  layoutConstellation,
  layoutField,
  project2D,
  vertexLocal,
} from "../src/layout.js";

const ROLES = ["anchor", "scout", "builder", "builder", "challenger", "scribe"] satisfies Role[];

const ZERO_TERMS = {
  closePace: 0,
  compatibleIntensity: 0,
  roleCoverage: 0,
  pairHistory: 0,
  rivalryDose: 0,
  churn: 0,
  repeatedPairings: 0,
} as const;

function assignmentFor(groups: readonly (readonly string[])[]): CohortAssignment {
  const memberRefs = groups.flat();

  return {
    id: "view-layout",
    cohorts: groups.map((group) => ({
      members: group.map((ref, index) => ({ ref, role: ROLES[index]! })),
    })),
    memberRefs,
    levelBands: { level: [10, 22], velocity: [10, 22] },
    candidateSetHash: "synthetic-layout",
    objectiveTerms: ZERO_TERMS,
    constraints: {
      age: true,
      schedule: true,
      separations: true,
      accommodations: true,
      caliper: { levelTolerance: 2, velocityTolerance: 2, k: 10 },
      nonHarmFloor: 0.5,
      benefitOf: () => 0.825,
      churn: { weekKey: "2026-W30", cap: 4, used: 0, exceptions: [] },
    },
    start: "2026-07-21T12:00:00Z",
    plannedReview: "2026-07-28T12:00:00Z",
    priorAssignmentId: null,
    rollbackRef: null,
    sizeExceptions: [],
  };
}

function learner(learnerRef: string, level: number, velocity: number): LearnerProfile {
  return {
    learnerRef,
    ageBand: learnerRef.startsWith("B") ? "a12_14" : "a9_11",
    schedule: { blocks: ["mon-pm", "wed-am"] },
    accommodations: { needs: [], conflicts: [] },
    level,
    velocity,
    separations: [],
    priorAssignmentRef: null,
  };
}

const A_REFS = ["A1", "A2", "A3", "A4", "A5", "A6"] as const;
const B_REFS = ["B1", "B2", "B3", "B4", "B5", "B6"] as const;

const POOL = [
  learner("A1", 10, 10),
  learner("A2", 11, 10),
  learner("A3", 10, 11),
  learner("A4", 12, 10),
  learner("A5", 11, 12),
  learner("A6", 12, 11),
  learner("B1", 20, 20),
  learner("B2", 21, 20),
  learner("B3", 20, 21),
  learner("B4", 22, 20),
  learner("B5", 21, 22),
  learner("B6", 22, 21),
] satisfies LearnerProfile[];

const EXPECTED_A_POSITIONS = [
  { x: -11, y: 0, z: 6 },
  { x: -5.804, y: 0, z: 3 },
  { x: -5.804, y: 0, z: -3 },
  { x: -11, y: 0, z: -6 },
  { x: -16.196, y: 0, z: -3 },
  { x: -16.196, y: 0, z: 3 },
] as const;

const EXPECTED_B_POSITIONS = [
  { x: 11, y: 0, z: 6 },
  { x: 16.196, y: 0, z: 3 },
  { x: 16.196, y: 0, z: -3 },
  { x: 11, y: 0, z: -6 },
  { x: 5.804, y: 0, z: -3 },
  { x: 5.804, y: 0, z: 3 },
] as const;

describe("Compiler Observatory layout", () => {
  it("pins the complete 3D layout and 2D projection registry", () => {
    expect(LAYOUT).toEqual({
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
    });

    expect([center(0), center(1), center(2), center(3)]).toEqual([
      { x: -11, y: 0, z: 0 },
      { x: 11, y: 0, z: 0 },
      { x: -11, y: 0, z: -22 },
      { x: 11, y: 0, z: -22 },
    ]);
    expect(Array.from({ length: 6 }, (_, index) => vertexLocal(index))).toEqual([
      { x: 0, y: 0, z: 6 },
      { x: 5.196, y: 0, z: 3 },
      { x: 5.196, y: 0, z: -3 },
      { x: 0, y: 0, z: -6 },
      { x: -5.196, y: 0, z: -3 },
      { x: -5.196, y: 0, z: 3 },
    ]);
    expect([benchSlot(0), benchSlot(1), benchSlot(2)]).toEqual([
      { x: -20, y: -8, z: 18 },
      { x: -15, y: -8, z: 18 },
      { x: -10, y: -8, z: 18 },
    ]);
  });

  it("lays out Fixture V1 as exact sorted hexes with floor halos and projected positions", () => {
    const assignment = assignmentFor([[...A_REFS].reverse(), [...B_REFS].reverse()]);
    const view = layoutConstellation(assignment, [...POOL].reverse());

    expect(view.world).toEqual(LAYOUT.WORLD);
    expect(view.camera).toEqual(LAYOUT.CAMERA);
    expect(view.fog).toEqual(LAYOUT.FOG);
    expect(view.caliperRadii).toEqual([5, 10, 15]);
    expect(view.bench).toEqual([]);
    expect(
      view.hexes.map(({ center: hexCenter, center2d, floorHalo }) => ({
        center: hexCenter,
        center2d,
        floorHalo,
      })),
    ).toEqual([
      {
        center: { x: -11, y: 0, z: 0 },
        center2d: { x: 536, y: 450 },
        floorHalo: { pos: { x: -11, y: -1.5, z: 0 }, radius: 8 },
      },
      {
        center: { x: 11, y: 0, z: 0 },
        center2d: { x: 1064, y: 450 },
        floorHalo: { pos: { x: 11, y: -1.5, z: 0 }, radius: 8 },
      },
    ]);

    expect(view.hexes[0]?.members.map(({ ref, pos, pos2d }) => ({ ref, pos, pos2d }))).toEqual(
      A_REFS.map((ref, index) => ({
        ref,
        pos: EXPECTED_A_POSITIONS[index],
        pos2d: [
          { x: 536, y: 306 },
          { x: 661, y: 378 },
          { x: 661, y: 522 },
          { x: 536, y: 594 },
          { x: 411, y: 522 },
          { x: 411, y: 378 },
        ][index],
      })),
    );
    expect(view.hexes[1]?.members.map(({ ref, pos, pos2d }) => ({ ref, pos, pos2d }))).toEqual(
      B_REFS.map((ref, index) => ({
        ref,
        pos: EXPECTED_B_POSITIONS[index],
        pos2d: [
          { x: 1064, y: 306 },
          { x: 1189, y: 378 },
          { x: 1189, y: 522 },
          { x: 1064, y: 594 },
          { x: 939, y: 522 },
          { x: 939, y: 378 },
        ][index],
      })),
    );
    expect(view.hexes[0]?.members[0]?.field).toEqual({ x: -2.5, y: 0, z: -2.5 });
    expect(view.hexes[1]?.members[0]?.field).toEqual({ x: 22.5, y: 0, z: 22.5 });
  });

  it("maps field starts deterministically and places unassigned pool members on the calm bench", () => {
    const c1 = learner("C1", 5, 5);

    expect([...layoutField([POOL[6]!, POOL[0]!]).entries()]).toEqual([
      ["A1", { x: -2.5, y: 0, z: -2.5 }],
      ["B1", { x: 22.5, y: 0, z: 22.5 }],
    ]);

    const view = layoutConstellation(assignmentFor([A_REFS]), [c1, ...POOL.slice(0, 6)]);
    expect(view.bench).toEqual([
      {
        ref: "C1",
        pos: { x: -20, y: -8, z: 18 },
        pos2d: { x: 320, y: 18 },
        field: { x: -15, y: 0, z: -15 },
        state: "unassigned",
        role: null,
      },
    ]);
  });

  it("projects the pinned 3D points and lays out Fixture V3's sorted speaker ring exactly", () => {
    expect(project2D({ x: -11, y: 999, z: 6 })).toEqual({ x: 536, y: 306 });
    expect(project2D({ x: 0, y: 0, z: 10 })).toEqual({ x: 800, y: 210 });

    expect(layoutArenaRing(["S3", "S1", "S2"])).toEqual([
      { speaker: "S1", pos: { x: 0, y: 0, z: 10 }, pos2d: { x: 800, y: 210 } },
      { speaker: "S2", pos: { x: 8.66, y: 0, z: -5 }, pos2d: { x: 1008, y: 570 } },
      { speaker: "S3", pos: { x: -8.66, y: 0, z: -5 }, pos2d: { x: 592, y: 570 } },
    ]);
    expect(layoutArenaRing([])).toEqual([]);
  });
});
