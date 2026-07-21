import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  buildObservatoryScene,
  easeSceneProgress,
  resolveObservatoryMotion,
} from "../components/observatory/scene.js";
import { buildSyntheticCohortView } from "../components/synthetic-view.js";

describe("the 3D Compiler Observatory", () => {
  it("projects the shared view into exact instanced stars and guarantee markers", () => {
    const view = buildSyntheticCohortView();
    const scene = buildObservatoryScene(view);

    expect(scene.stars).toHaveLength(12);
    expect(scene.stars[0]).toEqual({
      ref: "A1",
      cohortIndex: 0,
      role: "anchor",
      state: "assigned",
      start: { x: -2.5, y: 0, z: -2.5 },
      settled: { x: -11, y: 0, z: 6 },
    });
    expect(scene.stars[6]).toEqual({
      ref: "B1",
      cohortIndex: 1,
      role: "anchor",
      state: "assigned",
      start: { x: 22.5, y: 0, z: 22.5 },
      settled: { x: 11, y: 0, z: 6 },
    });
    expect(scene.stars[11]?.settled).toEqual({ x: 5.804, y: 0, z: 3 });

    expect(scene.caliperRadii).toEqual([5, 10, 15]);
    expect(scene.floorHalos).toEqual([
      {
        cohortIndex: 0,
        position: { x: -11, y: -1.5, z: 0 },
        radius: 8,
        minBenefit: 0.825,
        floor: 0.5,
      },
      {
        cohortIndex: 1,
        position: { x: 11, y: -1.5, z: 0 },
        radius: 8,
        minBenefit: 0.825,
        floor: 0.5,
      },
    ]);
    expect(scene.badges).toHaveLength(14);
    expect(scene.badges[0]).toEqual({
      cohortIndex: 0,
      constraint: "age",
      satisfied: true,
      position: { x: -11, y: 0.2, z: 8.5 },
    });
    expect(scene.badges[7]).toEqual({
      cohortIndex: 1,
      constraint: "age",
      satisfied: true,
      position: { x: 11, y: 0.2, z: 8.5 },
    });

    const withBench = {
      ...view,
      constellation: {
        ...view.constellation,
        bench: [
          {
            ref: "C1",
            pos: { x: -20, y: -8, z: 18 },
            pos2d: { x: 320, y: 18 },
            field: { x: -5, y: 0, z: -5 },
            state: "unassigned" as const,
            role: null,
          },
        ],
      },
    };
    expect(buildObservatoryScene(withBench).stars.at(-1)).toEqual({
      ref: "C1",
      cohortIndex: null,
      role: null,
      state: "unassigned",
      start: { x: -5, y: 0, z: -5 },
      settled: { x: -20, y: -8, z: 18 },
    });
  });

  it("derives compile, drift, and camera timing from the golden motion registry", () => {
    const view = buildSyntheticCohortView();

    expect(resolveObservatoryMotion(view)).toEqual({
      compile: { kind: "compile", mode: "animated", durationMs: 900, easing: "settle" },
      drift: {
        kind: "ambientDrift",
        mode: "animated",
        durationMs: 9000,
        easing: "linear",
      },
      camera: {
        kind: "cameraEase",
        mode: "animated",
        durationMs: 1200,
        easing: "move",
      },
    });

    expect(easeSceneProgress("settle", 0)).toBe(0);
    expect(easeSceneProgress("settle", 1)).toBe(1);
    expect(
      Math.max(
        ...Array.from({ length: 99 }, (_, index) => easeSceneProgress("settle", index / 100)),
      ),
    ).toBeLessThanOrEqual(1.04);
  });

  it("keeps all 3D motion in r3f and preserves the established 2D fallback boundary", () => {
    const sceneSource = readFileSync(
      new URL("../components/observatory/ObservatoryScene.tsx", import.meta.url),
      "utf8",
    );
    const sceneProjectionSource = readFileSync(
      new URL("../components/observatory/scene.ts", import.meta.url),
      "utf8",
    );
    const shellSource = readFileSync(
      new URL("../components/CohortArena.client.tsx", import.meta.url),
      "utf8",
    );

    expect(sceneSource).toContain("Instances");
    expect(sceneSource).toContain("Instance");
    expect(sceneSource).toContain("useFrame");
    expect(sceneProjectionSource).toContain("resolveMotion");
    expect(sceneSource).toContain("EffectComposer");
    expect(sceneSource).toContain("Bloom");
    expect(sceneSource).toContain("dispose");
    expect(sceneSource).not.toContain("Math.random");
    expect(sceneSource).not.toContain("OrbitControls");
    expect(shellSource).toContain("<ObservatoryScene view={VIEW}");
    expect(shellSource).toMatch(/tier2D\.active[\s\S]*?<CohortTier2D/);
    expect(shellSource).toMatch(/tier2D\.active[\s\S]*?<Canvas/);
    expect(shellSource).toMatch(/<Canvas[\s\S]*?aria-hidden="true"/);
  });
});
