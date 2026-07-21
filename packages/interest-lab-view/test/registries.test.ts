import type { WorkMode } from "@gt100k/interest-lab";
import { describe, expect, expectTypeOf, it } from "vitest";
import { HUE_RAMP, PALETTE, TYPOGRAPHY } from "../src/art";
import { WORK_MODE_GLYPHS } from "../src/glyphs";
import { EASINGS, MOTION } from "../src/motion";
import { CAMERA3D, QUALITY_TIERS, RENDER_TIERS, SCENE3D } from "../src/scene";

describe("interest-lab art registries", () => {
  it("pins the exact dusk palette and typography tokens", () => {
    expect(PALETTE).toEqual({
      night: "#181026",
      nightRaised: "#221A3D",
      nightSunk: "#120B1E",
      paperGuide: "#F6F3FB",
      inkGuide: "#241B3A",
      inkHi: "#F4F0FB",
      inkMuted: "#C3B8D9",
      spark: "#FF9E5E",
      sparkHi: "#FFC08A",
      beacon: "#FFD166",
      tide: "#5EC8D8",
      sprout: "#7BD88F",
      met: "#7BD88F",
      gap: "#8FA6C9",
      prompted: "#9A8FB5",
      support: "#5EC8D8",
      contested: "#E0A458",
      parked: "#8B93A7",
      focus: "#FFD166",
    });
    expect(TYPOGRAPHY).toEqual({
      fontDisplay: '"Fredoka","Baloo 2",ui-rounded,"Segoe UI Rounded",system-ui,sans-serif',
      fontReading: '"Iowan Old Style","Palatino","Georgia",ui-serif,serif',
      fontBody: '"Inter",ui-sans-serif,system-ui,"Segoe UI",sans-serif',
      scale: {
        display: { rem: 2.5, lh: 1.05, ls: -0.02, weight: 600 },
        h1: { rem: 1.75, lh: 1.1, ls: -0.01, weight: 600 },
        h2: { rem: 1.25, lh: 1.2, ls: 0, weight: 600 },
        reading: { rem: 1.0625, lh: 1.6, ls: 0, weight: 400 },
        body: { rem: 1, lh: 1.5, ls: 0, weight: 400 },
        label: { rem: 0.8125, lh: 1.4, ls: 0.01, weight: 500 },
      },
      numeric: "tabular-nums",
    });
  });

  it("pins the catalog-order hue ramp", () => {
    expect(HUE_RAMP).toEqual([
      "#E8825A",
      "#5FB98C",
      "#6C8CE8",
      "#C98BD9",
      "#E8B84B",
      "#E56B8C",
      "#4FC0C7",
      "#7E8CE0",
      "#9CC65A",
      "#E09E52",
      "#6FD1B0",
      "#D07AB0",
    ]);
  });
});

describe("interest-lab motion and glyph registries", () => {
  it("pins every duration and easing token", () => {
    expect(MOTION).toEqual({
      instant: 0,
      press: 120,
      micro: 150,
      tooltip: 150,
      fast: 200,
      drawer: 220,
      cardEnter: 260,
      matrixCell: 260,
      markerPop: 260,
      base: 300,
      tray: 320,
      stateMorph: 360,
      pick: 420,
      welcomeBack: 480,
      islandFocus: 520,
      ticker: 600,
      constellation: 600,
      timelineDraw: 700,
      driftIn: 1400,
      glowLoop: 1600,
      islandFloat: 6500,
      stagger: 40,
    });
    expect(EASINGS).toEqual({
      enter: "cubic-bezier(0.23,1,0.32,1)",
      move: "cubic-bezier(0.77,0,0.175,1)",
      pop: "cubic-bezier(0.34,1.56,0.64,1)",
      press: "cubic-bezier(0.5,0,0.5,1)",
      drawer: "cubic-bezier(0.32,0.72,0,1)",
      linear: "linear",
      pickSpring: { type: "spring", bounce: 0.2, duration: 0.42 },
    });
  });

  it("maps every work mode to its exact non-emoji glyph key", () => {
    expect(WORK_MODE_GLYPHS).toEqual({
      build: "glyph-hammer",
      investigate: "glyph-lens",
      compose: "glyph-quill",
      explain: "glyph-speech",
      perform: "glyph-star-stage",
      debug: "glyph-wrench-bug",
      collaborate: "glyph-hands",
      care: "glyph-heart",
      persuade: "glyph-flag",
    });
    expectTypeOf<keyof typeof WORK_MODE_GLYPHS>().toEqualTypeOf<WorkMode>();
  });
});

describe("interest-lab scene registries", () => {
  it("pins the exact scene and camera constants", () => {
    expect(SCENE3D).toEqual({
      bgHex: "#181026",
      fogHex: "#181026",
      fogNear: 14,
      fogFar: 46,
      ambientHex: "#3A2E5C",
      ambientIntensity: 0.35,
      hemiSkyHex: "#2A2140",
      hemiGroundHex: "#0E0A18",
      hemiIntensity: 0.4,
      keyHex: "#FFC08A",
      keyIntensity: 1.15,
      keyPos: [6, 10, 6],
      toneMapping: "ACESFilmic",
      exposure: 1.05,
      markerEmissiveHex: "#FF9E5E",
      markerEmissiveRest: 0.35,
      markerEmissivePulse: 0.5,
      bloomPeak: 1.4,
    });
    expect(CAMERA3D).toEqual({
      fov: 42,
      near: 0.1,
      far: 100,
      home: { pos: [0, 4.5, 15], target: [0, 0.4, 0] },
      establishStart: { pos: [0, 7, 22] },
      focusLerp: 0.075,
      focusFillDistance: 6.5,
      orbit: {
        enablePan: false,
        enableZoom: false,
        minPolarDeg: 60,
        maxPolarDeg: 85,
        azimuthClampDeg: 75,
        dampingFactor: 0.08,
      },
    });
  });

  it("pins the literal render tiers and exact quality parameters", () => {
    expect(RENDER_TIERS).toEqual(["quest-world-3d", "quest-world-3d-lite", "board-2d"]);
    expect(QUALITY_TIERS).toEqual({
      full: {
        dprCap: 2,
        shadows: true,
        bloom: true,
        motes: 60,
        islandDetail: "high",
        postprocessing: true,
      },
      lite: {
        dprCap: 1.5,
        shadows: false,
        bloom: false,
        motes: 24,
        islandDetail: "low",
        postprocessing: false,
      },
      board2d: {
        dprCap: 0,
        shadows: false,
        bloom: false,
        motes: 0,
        islandDetail: "none",
        postprocessing: false,
      },
    });
  });
});
