import { EASINGS, MOTION, SPRINGS, resolveMotion } from "@gt100k/evidence-explorer-view";
import { describe, expect, it } from "vitest";

/** Golden motion tokens + `resolveMotion` table (§U8.5, exact). */
describe("motion tokens", () => {
  it("MOTION durations are exact", () => {
    expect(MOTION).toEqual({
      instant: 0,
      press: 120,
      micro: 150,
      tooltip: 160,
      scrubStep: 180,
      fast: 200,
      reveal: 220,
      panel: 260,
      base: 300,
      zoom: 300,
      edgeDraw: 320,
      node: 360,
      timeline: 400,
      tamper: 400,
      tierCrossfade: 400,
      verifyStep: 420,
      bodyReveal: 520,
      fracture: 520,
      count: 600,
      dofPulse: 700,
      sealForge: 900,
      rootDiverge: 900,
      rootTick: 1200,
      verifyWave: 1800,
      glowLoop: 2200,
      flyIn: 2400,
      ambient: 6000,
      parallaxDrift: 24000,
    });
  });

  it("EASINGS are exact", () => {
    expect(EASINGS).toEqual({
      enter: "cubic-bezier(0.23,1,0.32,1)",
      expoOut: "cubic-bezier(0.16,1,0.3,1)",
      move: "cubic-bezier(0.65,0,0.35,1)",
      pop: "cubic-bezier(0.34,1.56,0.64,1)",
      press: "cubic-bezier(0.4,0,0.6,1)",
      drawer: "cubic-bezier(0.32,0.72,0,1)",
      linear: "linear",
    });
  });

  it("SPRINGS are exact", () => {
    expect(SPRINGS.ui).toEqual({ type: "spring", bounce: 0, duration: 0.4 });
    expect(SPRINGS.flick).toEqual({ type: "spring", bounce: 0.15, duration: 0.45 });
    expect(SPRINGS.cameraDampLambda).toBe(4.0);
    expect(SPRINGS.focusDampLambda).toBe(5.0);
    expect(SPRINGS.orbitDampLambda).toBe(3.2);
    expect(SPRINGS.momentumDecel).toBe(0.998);
  });

  it("resolveMotion animated column matches the golden table", () => {
    expect(resolveMotion("flyIn", { reducedMotion: false })).toEqual({
      kind: "flyIn",
      mode: "animated",
      durationMs: 2400,
      easing: "expoOut",
    });
    expect(resolveMotion("bodyReveal", { reducedMotion: false })).toEqual({
      kind: "bodyReveal",
      mode: "animated",
      durationMs: 520,
      easing: "pop",
    });
    expect(resolveMotion("focus", { reducedMotion: false })).toEqual({
      kind: "focus",
      mode: "animated",
      durationMs: 700,
      easing: "expoOut",
    });
    expect(resolveMotion("verifyWave", { reducedMotion: false })).toEqual({
      kind: "verifyWave",
      mode: "animated",
      durationMs: 1800,
      easing: "enter",
    });
  });

  it("resolveMotion reduced column: linear easing + reduced durations", () => {
    expect(resolveMotion("flyIn", { reducedMotion: true })).toEqual({
      kind: "flyIn",
      mode: "reduced",
      durationMs: 0,
      easing: "linear",
    });
    // press is non-vestibular: kept at 120ms even under reduced motion.
    expect(resolveMotion("press", { reducedMotion: true })).toEqual({
      kind: "press",
      mode: "reduced",
      durationMs: 120,
      easing: "linear",
    });
    expect(resolveMotion("panelOpen", { reducedMotion: true })).toEqual({
      kind: "panelOpen",
      mode: "reduced",
      durationMs: 150,
      easing: "linear",
    });
    expect(resolveMotion("sealForge", { reducedMotion: true })).toEqual({
      kind: "sealForge",
      mode: "reduced",
      durationMs: 150,
      easing: "linear",
    });
  });
});
