import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { RollbackControl } from "../components/RollbackControl.js";
import {
  buildObservatoryScene,
  resolveObservatoryMotion,
} from "../components/observatory/scene.js";
import {
  SYNTHETIC_ROLLBACK_ASSIGNMENTS,
  buildSyntheticRollbackViews,
} from "../components/synthetic-view.js";

describe("the display-only rollback preview", () => {
  it("pins the A6 to A7 diff and exact prior-snapshot star targets without mutating domain input", () => {
    const domainBefore = JSON.stringify(SYNTHETIC_ROLLBACK_ASSIGNMENTS);
    const snapshots = buildSyntheticRollbackViews();
    const current = buildObservatoryScene(snapshots.current);
    const prior = buildObservatoryScene(snapshots.prior);

    expect(snapshots.current.ledger.announce).toBe(
      "Assignment changed — removed:[A6]; added:[A7].",
    );
    expect(snapshots.prior.ledger.announce).toBe("Assignment changed — removed:[A7]; added:[A6].");
    expect(snapshots.current.cohorts.map(({ churnDelta }) => churnDelta)).toEqual([2, 0]);
    expect(snapshots.prior.cohorts.map(({ churnDelta }) => churnDelta)).toEqual([2, 0]);

    expect(current.stars.find(({ ref }) => ref === "A6")?.settled).toEqual({
      x: -20,
      y: -8,
      z: 18,
    });
    expect(current.stars.find(({ ref }) => ref === "A7")?.settled).toEqual({
      x: -16.196,
      y: 0,
      z: 3,
    });
    expect(prior.stars.find(({ ref }) => ref === "A6")?.settled).toEqual({
      x: -16.196,
      y: 0,
      z: 3,
    });
    expect(prior.stars.find(({ ref }) => ref === "A7")?.settled).toEqual({
      x: -20,
      y: -8,
      z: 18,
    });
    expect(JSON.stringify(SYNTHETIC_ROLLBACK_ASSIGNMENTS)).toBe(domainBefore);
  });

  it("renders an accessible reversible control with exact animated and reduced rollback tokens", () => {
    const animated = renderToStaticMarkup(
      createElement(RollbackControl, {
        currentAssignmentId: "asg-view-v2",
        priorAssignmentId: "asg-view-v1",
        reducedMotion: false,
        rolledBack: false,
        onToggle: vi.fn(),
      }),
    );
    const reduced = renderToStaticMarkup(
      createElement(RollbackControl, {
        currentAssignmentId: "asg-view-v2",
        priorAssignmentId: "asg-view-v1",
        reducedMotion: true,
        rolledBack: true,
        onToggle: vi.fn(),
      }),
    );

    expect(animated).toContain('aria-pressed="false"');
    expect(animated).toContain('data-motion-kind="rollback"');
    expect(animated).toContain('data-motion-mode="animated"');
    expect(animated).toContain('data-motion-duration="600"');
    expect(animated).toContain("Preview rollback to asg-view-v1");
    expect(animated).toContain("Display only");
    expect(reduced).toContain('aria-pressed="true"');
    expect(reduced).toContain('data-motion-mode="reduced"');
    expect(reduced).toContain('data-motion-duration="0"');
    expect(reduced).toContain("Return to current snapshot asg-view-v2");
    expect(reduced).toContain("Prior snapshot asg-view-v1 shown");
  });

  it("keys an interruptible live-position r3f retarget to only the rollback registry entry", () => {
    const snapshots = buildSyntheticRollbackViews();
    const sceneSource = readFileSync(
      new URL("../components/observatory/ObservatoryScene.tsx", import.meta.url),
      "utf8",
    );
    const shellSource = readFileSync(
      new URL("../components/CohortArena.client.tsx", import.meta.url),
      "utf8",
    );
    const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

    expect(resolveObservatoryMotion(snapshots.current).rollback).toEqual({
      kind: "rollback",
      mode: "animated",
      durationMs: 600,
      easing: "rollback",
    });
    expect(
      resolveObservatoryMotion(buildSyntheticRollbackViews({ reducedMotion: true }).current)
        .rollback,
    ).toEqual({ kind: "rollback", mode: "reduced", durationMs: 0, easing: "linear" });
    expect(sceneSource).toContain("useFrame");
    expect(sceneSource).toContain("livePosition?.clone()");
    expect(sceneSource).toContain('transitionKind === "rollback"');
    expect(sceneSource).toContain("motion.rollback");
    expect(shellSource).toContain("<RollbackControl");
    expect(shellSource).toContain(
      'transitionKind={hasSnapshotTransition ? "rollback" : "compile"}',
    );
    expect(css).toMatch(/\.rollback-control button\s*\{[\s\S]*?min-height:\s*44px/);
  });
});
