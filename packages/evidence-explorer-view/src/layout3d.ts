/**
 * Deterministic 3D layout (§U8.2, exact via authored slot table) — a fixed rank × authored-unit-
 * slot lattice, never a force sim. `x = depthRank·COL_W_3D`; `(y,z)` come from `SHELL_SLOTS` (12
 * pre-computed unit positions at 30° steps) so there is **no** `Math.sin`/`Math.cos` on the golden
 * path (§U8.14). The cosmos `CENTER_3D` is an authored constant (the camera look-at, §U8.9).
 */
import type { EvidenceGraph } from "@gt100k/evidence-graph";
import type { Bounds3D, Vec3 } from "./model.js";
import { provenanceRanks } from "./ranks.js";

export const COL_W_3D = 6;
export const SHELL_R = 3.2;
export const ISLAND: Vec3 = [0, -9, 0];
/** Authored cosmos center (camera look-at, §U8.9) — not the raw AABB midpoint. */
export const CENTER_3D: Vec3 = [15, -1, 0];

/** 12 authored unit slots at 30° steps: `{ uy: cosθ, uz: sinθ }` (exact literals, §U8.2). */
export const SHELL_SLOTS: ReadonlyArray<{ readonly uy: number; readonly uz: number }> = [
  { uy: 1.0, uz: 0.0 }, // 0°
  { uy: 0.866025, uz: 0.5 }, // 30°
  { uy: 0.5, uz: 0.866025 }, // 60°
  { uy: 0.0, uz: 1.0 }, // 90°
  { uy: -0.5, uz: 0.866025 }, // 120°
  { uy: -0.866025, uz: 0.5 }, // 150°
  { uy: -1.0, uz: 0.0 }, // 180°
  { uy: -0.866025, uz: -0.5 }, // 210°
  { uy: -0.5, uz: -0.866025 }, // 240°
  { uy: 0.0, uz: -1.0 }, // 270°
  { uy: 0.5, uz: -0.866025 }, // 300°
  { uy: 0.866025, uz: -0.5 }, // 330°
];

export interface Layout3DResult {
  readonly positions: Map<string, Vec3>;
  readonly bounds: Bounds3D;
  readonly center: Vec3;
}

export function layoutExplorer3D(graph: EvidenceGraph): Layout3DResult {
  const positions = new Map<string, Vec3>();
  const min: [number, number, number] = [
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
  ];
  const max: [number, number, number] = [
    Number.NEGATIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
  ];

  for (const r of provenanceRanks(graph)) {
    let pos: Vec3;
    if (r.isIsland) {
      pos = ISLAND;
    } else {
      const slotStep = Math.floor(12 / r.countInRank);
      const slotIndex = (r.orderInRank * slotStep) % 12;
      const slot = SHELL_SLOTS[slotIndex] ?? SHELL_SLOTS[0];
      pos = [r.depthRank * COL_W_3D, SHELL_R * slot.uy, SHELL_R * slot.uz];
    }
    positions.set(r.node.id, pos);
    for (let axis = 0; axis < 3; axis += 1) {
      min[axis] = Math.min(min[axis], pos[axis]);
      max[axis] = Math.max(max[axis], pos[axis]);
    }
  }

  return {
    positions,
    bounds: { min: [min[0], min[1], min[2]], max: [max[0], max[1], max[2]] },
    center: CENTER_3D,
  };
}
