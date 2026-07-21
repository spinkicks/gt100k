import { EASINGS, LAMBDAS, MOTION, resolveMotion } from "@gt100k/arena-world";
import { describe, expect, it } from "vitest";

const GOLDEN_MOTIONS = [
  ["press", 120, "Quad.Out", 120],
  ["nodeReveal", 220, "Back.Out", 0],
  ["traverse", 600, "Cubic.Out", 150],
  ["run", 380, "Cubic.Out", 150],
  ["regionZoom", 300, "Cubic.Out", 0],
  ["intro", 1200, "Cubic.InOut", 0],
  ["availableGlow", 1200, "Sine.InOut", 0],
  ["tierAdvance", 600, "Cubic.Out", 0],
  ["equip", 200, "Cubic.Out", 0],
  ["drawerOpen", 220, "Cubic.Out", 150],
  ["sceneTransition", 350, "Cubic.Out", 150],
  ["baseAccretion", 300, "Back.Out", 0],
  ["standingsExpand", 220, "Cubic.Out", 0],
  ["onboardBeat", 300, "Cubic.Out", 0],
  ["islandFloat", 8000, "Sine.InOut", 0],
  ["sunDrift", 120000, "Linear", 0],
] as const;

describe("arena motion tokens", () => {
  it("keeps the exact scripted-motion and damping registries", () => {
    expect(MOTION).toEqual({
      instant: 0,
      press: 120,
      micro: 150,
      fast: 220,
      reveal: 220,
      base: 300,
      zoom: 300,
      sceneFade: 350,
      runSeg: 380,
      celebrateLow: 400,
      move: 600,
      celebrateMed: 600,
      equip: 200,
      celebrateHigh: 800,
      lantern: 900,
      glowLoop: 1200,
      intro: 1200,
      idleBob: 1600,
      particleLife: 800,
      islandFloat: 8000,
      sunDrift: 120000,
    });
    expect(EASINGS).toEqual({
      enter: { three: "Cubic.Out", css: "cubic-bezier(0.23,1,0.32,1)" },
      move: { three: "Sine.InOut", css: "cubic-bezier(0.77,0,0.175,1)" },
      pop: "Back.Out",
      press: "Quad.Out",
      loop: "Sine.InOut",
      intro: "Cubic.InOut",
      linear: "Linear",
    });
    expect(LAMBDAS).toEqual({
      cameraFollow: 3.5,
      avatarMove: 6,
      avatarTurn: 8,
      beaconRise: 4,
      bloomPulse: 5,
      orbit: 0.08,
    });
  });

  it("resolves the exact animated motion table", () => {
    expect(GOLDEN_MOTIONS.map(([kind]) => resolveMotion(kind, { reducedMotion: false }))).toEqual(
      GOLDEN_MOTIONS.map(([kind, durationMs, easing]) => ({
        kind,
        mode: "animated",
        durationMs,
        easing,
      })),
    );
  });

  it("gives every motion kind its exact reduced-motion equivalent", () => {
    expect(GOLDEN_MOTIONS.map(([kind]) => resolveMotion(kind, { reducedMotion: true }))).toEqual(
      GOLDEN_MOTIONS.map(([kind, , , durationMs]) => ({
        kind,
        mode: "reduced",
        durationMs,
        easing: "Linear",
      })),
    );
  });

  it("is deterministic for identical inputs", () => {
    const first = GOLDEN_MOTIONS.map(([kind]) => resolveMotion(kind, { reducedMotion: true }));
    const second = GOLDEN_MOTIONS.map(([kind]) => resolveMotion(kind, { reducedMotion: true }));

    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
  });
});
