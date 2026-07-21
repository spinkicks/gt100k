import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { CohortArenaView } from "@gt100k/cohort-arena-view";

import { ArenaRoomPanel } from "../components/arena/ArenaRoomPanel.js";
import {
  buildArenaRoomScene,
  resolveArenaFrameLoop,
  resolveArenaRoomMotion,
} from "../components/arena/scene.js";
import { buildSyntheticCohortView } from "../components/synthetic-view.js";

function occurrences(value: string, token: string): number {
  return value.split(token).length - 1;
}

function withTruthfulFloorHolder(view: CohortArenaView, speaker: string): CohortArenaView {
  if (!view.rivalry) throw new Error("Fixture V3 rivalry view is required");

  return {
    ...view,
    rivalry: {
      ...view.rivalry,
      seats: view.rivalry.seats.map((seat) => ({
        ...seat,
        holdingFloor: seat.speaker === speaker,
      })),
    },
  };
}

describe("the RivalryMix arena room", () => {
  it("projects Fixture V3 into the exact seat ring without inventing a live floor holder", () => {
    const view = buildSyntheticCohortView();
    const scene = buildArenaRoomScene(view);

    expect(scene).toEqual({
      seats: [
        {
          speaker: "S1",
          pos: { x: 0, y: 0, z: 10 },
          pos2d: { x: 800, y: 210 },
          turnShare: 4 / 6,
          interruptions: 0,
          holdingFloor: false,
        },
        {
          speaker: "S2",
          pos: { x: 8.66, y: 0, z: -5 },
          pos2d: { x: 1008, y: 570 },
          turnShare: 1 / 6,
          interruptions: 0,
          holdingFloor: false,
        },
        {
          speaker: "S3",
          pos: { x: -8.66, y: 0, z: -5 },
          pos2d: { x: 592, y: 570 },
          turnShare: 1 / 6,
          interruptions: 0,
          holdingFloor: false,
        },
      ],
      confidence: 1,
      suppressed: false,
    });
    expect(resolveArenaRoomMotion(view)).toEqual({
      kind: "turnPulse",
      mode: "animated",
      durationMs: 1200,
      easing: "loop",
    });
    expect(view.ledger.rivalryList).toContain("dominance: S1 — S1 holds 4/6 turns (66.7%) > 50%");
  });

  it("renders a motion-free project2D highlight from an explicit observable holder marker", () => {
    const reduced = withTruthfulFloorHolder(
      buildSyntheticCohortView({ reducedMotion: true }),
      "S1",
    );
    const markup = renderToStaticMarkup(
      createElement(ArenaRoomPanel, { view: reduced, reducedMotion: true }),
    );

    expect(markup).toContain('data-region="arena-room-2d"');
    expect(markup).toContain('data-motion-kind="turnPulse"');
    expect(markup).toContain('data-motion-mode="reduced"');
    expect(markup).toContain('data-motion-duration="0"');
    expect(occurrences(markup, 'data-arena-seat="true"')).toBe(3);
    expect(markup).toContain(
      'data-speaker="S1" data-x="800" data-y="210" data-holding-floor="true"',
    );
    expect(markup).toContain(
      'data-speaker="S2" data-x="1008" data-y="570" data-holding-floor="false"',
    );
    expect(markup).toContain(
      'data-speaker="S3" data-x="592" data-y="570" data-holding-floor="false"',
    );
    expect(markup).toContain("S1 holds the floor");
    expect(markup).not.toContain("<canvas");
  });

  it("renders on demand until a truthful floor-holder pulse is active", () => {
    const aggregate = buildSyntheticCohortView();
    const withHolder = withTruthfulFloorHolder(aggregate, "S1");

    expect(resolveArenaFrameLoop(buildArenaRoomScene(aggregate))).toBe("demand");
    expect(resolveArenaFrameLoop(buildArenaRoomScene(withHolder))).toBe("always");
  });

  it("owns pulse motion in r3f and keeps the accessible Ledger beside the hidden canvas", () => {
    const sceneSource = readFileSync(
      new URL("../components/arena/ArenaRoomScene.tsx", import.meta.url),
      "utf8",
    );
    const projectionSource = readFileSync(
      new URL("../components/arena/scene.ts", import.meta.url),
      "utf8",
    );
    const shellSource = readFileSync(
      new URL("../components/CohortArena.client.tsx", import.meta.url),
      "utf8",
    );

    expect(sceneSource).toContain("useFrame");
    expect(sceneSource).toContain("emissiveIntensity");
    expect(sceneSource).toContain("arena-light-column");
    expect(sceneSource).not.toContain("Math.random");
    expect(projectionSource).toContain('resolveMotion("turnPulse"');
    expect(shellSource).toMatch(/<ArenaRoomPanel[\s\S]*?view=\{view\}/);
    expect(shellSource).toMatch(/<Canvas[\s\S]*?aria-hidden="true"/);
    expect(shellSource).toContain("<CohortLedger ledger={view.ledger}");
  });
});
