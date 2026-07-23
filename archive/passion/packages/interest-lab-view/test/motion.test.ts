import { describe, expect, it } from "vitest";
import { EASINGS, resolveMotion } from "../src/index";

const MOTION_GOLDEN = {
  press: { durationMs: 120, easing: EASINGS.press, reducedDurationMs: 120 },
  cardEnter: { durationMs: 260, easing: EASINGS.enter, reducedDurationMs: 0 },
  cardStagger: { durationMs: 40, easing: EASINGS.enter, reducedDurationMs: 0 },
  hoverLift: { durationMs: 150, easing: EASINGS.enter, reducedDurationMs: 0 },
  pick: { durationMs: 420, easing: "pickSpring", reducedDurationMs: 150 },
  welcomeBack: { durationMs: 480, easing: EASINGS.pop, reducedDurationMs: 0 },
  promptedRecede: { durationMs: 300, easing: EASINGS.enter, reducedDurationMs: 0 },
  trayReturn: { durationMs: 320, easing: EASINGS.enter, reducedDurationMs: 150 },
  driftIn: { durationMs: 1400, easing: EASINGS.move, reducedDurationMs: 0 },
  islandFloat: { durationMs: 6500, easing: EASINGS.linear, reducedDurationMs: 0 },
  islandFocus: { durationMs: 520, easing: EASINGS.move, reducedDurationMs: 0 },
  markerGlow: { durationMs: 1600, easing: EASINGS.linear, reducedDurationMs: 0 },
  motes: { durationMs: 1600, easing: EASINGS.linear, reducedDurationMs: 0 },
  matrixCell: { durationMs: 260, easing: EASINGS.enter, reducedDurationMs: 0 },
  matrixStagger: { durationMs: 40, easing: EASINGS.enter, reducedDurationMs: 0 },
  ticker: { durationMs: 600, easing: EASINGS.enter, reducedDurationMs: 0 },
  timelineDraw: { durationMs: 700, easing: EASINGS.move, reducedDurationMs: 0 },
  markerPop: { durationMs: 260, easing: EASINGS.pop, reducedDurationMs: 0 },
  explanationsReveal: { durationMs: 300, easing: EASINGS.enter, reducedDurationMs: 0 },
  stateMorph: { durationMs: 360, easing: EASINGS.move, reducedDurationMs: 0 },
  gateCheck: { durationMs: 200, easing: EASINGS.pop, reducedDurationMs: 0 },
  constellation: { durationMs: 600, easing: EASINGS.enter, reducedDurationMs: 0 },
  drawerOpen: { durationMs: 220, easing: EASINGS.drawer, reducedDurationMs: 150 },
  tooltip: { durationMs: 150, easing: EASINGS.enter, reducedDurationMs: 0 },
  glowLoop: { durationMs: 1600, easing: EASINGS.linear, reducedDurationMs: 0 },
} as const;

type GoldenMotionKind = keyof typeof MOTION_GOLDEN;

const MOTION_KINDS = Object.keys(MOTION_GOLDEN) as GoldenMotionKind[];

describe("resolveMotion", () => {
  it("matches the complete animated motion golden table", () => {
    for (const kind of MOTION_KINDS) {
      const expected = MOTION_GOLDEN[kind];

      expect(resolveMotion(kind, { reducedMotion: false })).toEqual({
        kind,
        mode: "animated",
        durationMs: expected.durationMs,
        easing: expected.easing,
      });
    }
  });

  it("provides the exact reduced-motion equivalent for every kind", () => {
    for (const kind of MOTION_KINDS) {
      expect(resolveMotion(kind, { reducedMotion: true })).toEqual({
        kind,
        mode: "reduced",
        durationMs: MOTION_GOLDEN[kind].reducedDurationMs,
        easing: "linear",
      });
    }
  });

  it("reserves the only spring for the momentum-driven pick gesture", () => {
    const springKinds = MOTION_KINDS.filter(
      (kind) => resolveMotion(kind, { reducedMotion: false }).easing === "pickSpring",
    );

    expect(springKinds).toEqual(["pick"]);
    expect(resolveMotion("pick", { reducedMotion: true }).easing).toBe("linear");
  });

  it("keeps reveal tokens free of scale-zero instructions", () => {
    const revealKinds = [
      "cardEnter",
      "welcomeBack",
      "markerPop",
      "gateCheck",
      "constellation",
      "drawerOpen",
    ] as const;

    for (const kind of revealKinds) {
      const token = resolveMotion(kind, { reducedMotion: false });

      expect(Object.keys(token).sort()).toEqual(["durationMs", "easing", "kind", "mode"]);
      expect(JSON.stringify(token)).not.toMatch(/scale\s*\(\s*0\s*\)/i);
    }
  });
});
