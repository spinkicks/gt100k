import { existsSync, readFileSync } from "node:fs";
import {
  CATALOG,
  type DeviceCaps,
  type InitialArenaView,
  type LearningMomentSignal,
  type QualityTier,
} from "@gt100k/arena-world";
import { describe, expect, it } from "vitest";

const APP_ROOT = new URL("../../../apps/arena/", import.meta.url);

function appFile(relativePath: string): URL {
  return new URL(relativePath, APP_ROOT);
}

function readAppFile(relativePath: string): string {
  const fileUrl = appFile(relativePath);
  return existsSync(fileUrl) ? readFileSync(fileUrl, "utf8") : "";
}

async function importAppModule<T>(relativePath: string): Promise<Partial<T>> {
  const fileUrl = appFile(relativePath);
  if (!existsSync(fileUrl)) return {};
  return import(/* @vite-ignore */ fileUrl.href) as Promise<T>;
}

interface ArenaPublicConfig {
  seed: number;
  reducedMotionDefault: "system" | "on" | "off";
  ageBand: "6-8" | "9-11" | "12-14";
  qualityTier: "auto" | QualityTier;
}

interface ArenaClientModule {
  createArenaClientSnapshot(
    caps: DeviceCaps,
    config: ArenaPublicConfig,
  ): { view: InitialArenaView; renderer: "canvas" | "fallback-2d" };
}

interface SequencedArenaFeedback {
  sequence: number;
  signal: LearningMomentSignal;
}

interface ResolvedArenaFeedback {
  kind: "celebration" | "not-yet";
  event: {
    type: "independent-unlock" | "productive-struggle";
    nodeId?: string;
    intensity: "low" | "medium" | "high";
    copyStyle: "process-praise";
  } | null;
  soundCue: {
    cueId: string;
    caption: string;
    mutedByDefault: true;
  };
}

interface FeedbackModule {
  resolveArenaFeedback(signal: LearningMomentSignal): ResolvedArenaFeedback;
}

interface FxPlan {
  sequence: number;
  kind: "burst" | "warm-pulse" | "not-yet-wisp" | "static-badge";
  anchor: { x: number; y: number; z: number };
  particleCount: number;
  durationMs: number;
  bloomPeak: number;
  cameraPunch: boolean;
  beaconIgnition: "animated" | "steady" | "none";
  burstDelayMs: number;
  beaconDelayMs: number;
  cameraDelayMs: number;
  staticBadge: "beacon-lit" | "effort-honored" | "not-yet" | null;
  announcement: string;
  soundCue: ResolvedArenaFeedback["soundCue"];
}

interface ParticleSeed {
  x: number;
  y: number;
  z: number;
  velocityX: number;
  velocityY: number;
  velocityZ: number;
}

interface CameraPunchFrame {
  distanceDelta: number;
  fovDelta: number;
}

interface FxModule {
  default: (props: {
    view: InitialArenaView;
    feedback?: SequencedArenaFeedback;
    targetNodeId?: string;
  }) => unknown;
  buildFxPlan(
    view: InitialArenaView,
    feedback: SequencedArenaFeedback,
    targetNodeId?: string,
  ): FxPlan;
  createParticleSeeds(count: number): ParticleSeed[];
  resolveCameraPunch(elapsedMs: number): CameraPunchFrame;
}

interface PostFxPlan {
  enabled: boolean;
  bloom: {
    threshold: number;
    baselineIntensity: number;
    peakIntensity: number;
    radius: number;
    mipmapBlur: boolean;
  } | null;
  vignette: { offset: number; darkness: number } | null;
  smaa: boolean;
  pulseDelayMs: number;
  pulseDurationMs: number;
}

interface PostFxModule {
  default: (props: {
    view: InitialArenaView;
    feedback?: SequencedArenaFeedback;
  }) => unknown;
  buildPostFxPlan(view: InitialArenaView, feedback?: SequencedArenaFeedback): PostFxPlan;
  dampScalar(current: number, target: number, lambda: number, delta: number): number;
}

const AUTO_CONFIG: ArenaPublicConfig = {
  seed: 42,
  reducedMotionDefault: "system",
  ageBand: "9-11",
  qualityTier: "auto",
};

function capsForTier(tier: QualityTier): DeviceCaps {
  return {
    webgl2: tier !== "D",
    webgl1: tier !== "D",
    prefersReducedMotion: tier === "C",
    isSafari: tier === "B",
    deviceMemoryGB: 8,
    hardwareConcurrency: 8,
  };
}

async function buildView(tier: QualityTier): Promise<InitialArenaView> {
  const client = await importAppModule<ArenaClientModule>("app/ArenaClient.tsx");
  expect(client.createArenaClientSnapshot).toBeTypeOf("function");
  if (!client.createArenaClientSnapshot) throw new Error("Arena client snapshot is unavailable");

  return client.createArenaClientSnapshot(capsForTier(tier), {
    ...AUTO_CONFIG,
    qualityTier: tier,
    reducedMotionDefault: tier === "C" ? "on" : "off",
  }).view;
}

const HIGH_FEEDBACK = {
  sequence: 1,
  signal: {
    type: "independent-unlock",
    nodeId: "place-value-point",
    transferCritical: true,
  },
} as const satisfies SequencedArenaFeedback;

const STRUGGLE_FEEDBACK = {
  sequence: 2,
  signal: { type: "productive-struggle" },
} as const satisfies SequencedArenaFeedback;

const NOT_YET_FEEDBACK = {
  sequence: 3,
  signal: { type: "incorrect-attempt" },
} as const satisfies SequencedArenaFeedback;

describe("arena P3 learning feedback", () => {
  it("resolves celebration and not-yet feedback to deterministic muted captions", async () => {
    const feedback = await importAppModule<FeedbackModule>("app/scene/feedback.ts");

    expect(feedback.resolveArenaFeedback).toBeTypeOf("function");
    if (!feedback.resolveArenaFeedback) return;

    expect(feedback.resolveArenaFeedback(HIGH_FEEDBACK.signal)).toEqual({
      kind: "celebration",
      event: {
        type: "independent-unlock",
        nodeId: "place-value-point",
        intensity: "high",
        copyStyle: "process-praise",
      },
      soundCue: {
        cueId: "beacon-arpeggio",
        caption: "[beacon lights up]",
        mutedByDefault: true,
      },
    });
    expect(feedback.resolveArenaFeedback(STRUGGLE_FEEDBACK.signal)).toEqual({
      kind: "celebration",
      event: {
        type: "productive-struggle",
        intensity: "low",
        copyStyle: "process-praise",
      },
      soundCue: {
        cueId: "encourage-tone",
        caption: "[keep-going tone]",
        mutedByDefault: true,
      },
    });
    expect(feedback.resolveArenaFeedback(NOT_YET_FEEDBACK.signal)).toEqual({
      kind: "not-yet",
      event: null,
      soundCue: {
        cueId: "soft-tap",
        caption: "[soft tap]",
        mutedByDefault: true,
      },
    });
  });

  it("plans exact quality-scaled burst, warm-pulse, not-yet, and static equivalents", async () => {
    const [fx, tierA, tierB, tierC] = await Promise.all([
      importAppModule<FxModule>("app/scene/Fx.tsx"),
      buildView("A"),
      buildView("B"),
      buildView("C"),
    ]);

    expect(fx.buildFxPlan).toBeTypeOf("function");
    if (!fx.buildFxPlan) return;

    expect(fx.buildFxPlan(tierA, HIGH_FEEDBACK)).toEqual({
      sequence: 1,
      kind: "burst",
      anchor: { x: 15, y: 0.6, z: 3 },
      particleCount: 24,
      durationMs: 800,
      bloomPeak: 1.4,
      cameraPunch: true,
      beaconIgnition: "animated",
      burstDelayMs: 120,
      beaconDelayMs: 120,
      cameraDelayMs: 120,
      staticBadge: null,
      announcement: "You lit Tide-Pool Terraces — you did it yourself.",
      soundCue: {
        cueId: "beacon-arpeggio",
        caption: "[beacon lights up]",
        mutedByDefault: true,
      },
    });
    expect(fx.buildFxPlan(tierB, HIGH_FEEDBACK).particleCount).toBe(12);

    expect(fx.buildFxPlan(tierA, STRUGGLE_FEEDBACK, "observe-overlook")).toMatchObject({
      sequence: 2,
      kind: "warm-pulse",
      anchor: { x: 35, y: 2.1, z: 3 },
      particleCount: 6,
      durationMs: 400,
      bloomPeak: 0.7,
      cameraPunch: false,
      beaconIgnition: "none",
      burstDelayMs: 0,
      beaconDelayMs: 0,
      cameraDelayMs: 0,
      staticBadge: null,
      announcement: "You kept going after a tricky one — that's the work.",
    });
    expect(fx.buildFxPlan(tierA, NOT_YET_FEEDBACK, "place-value-point")).toMatchObject({
      sequence: 3,
      kind: "not-yet-wisp",
      anchor: { x: 15, y: 0.6, z: 3 },
      particleCount: 0,
      durationMs: 300,
      bloomPeak: 0.7,
      cameraPunch: false,
      beaconIgnition: "none",
      burstDelayMs: 0,
      beaconDelayMs: 0,
      cameraDelayMs: 0,
      staticBadge: null,
      announcement: "Not yet — keep trying a strategy.",
      soundCue: {
        cueId: "soft-tap",
        caption: "[soft tap]",
        mutedByDefault: true,
      },
    });
    expect(fx.buildFxPlan(tierC, HIGH_FEEDBACK)).toMatchObject({
      kind: "static-badge",
      particleCount: 0,
      durationMs: 150,
      bloomPeak: 0.7,
      cameraPunch: false,
      beaconIgnition: "steady",
      burstDelayMs: 0,
      beaconDelayMs: 0,
      cameraDelayMs: 0,
      staticBadge: "beacon-lit",
    });
  });

  it("keeps particle generation deterministic and the camera punch bounded and reversible", async () => {
    const fx = await importAppModule<FxModule>("app/scene/Fx.tsx");

    expect(fx.createParticleSeeds).toBeTypeOf("function");
    expect(fx.resolveCameraPunch).toBeTypeOf("function");
    if (!fx.createParticleSeeds || !fx.resolveCameraPunch) return;

    const first = fx.createParticleSeeds(24);
    const second = fx.createParticleSeeds(24);
    expect(first).toEqual(second);
    expect(first).not.toBe(second);
    expect(first).toHaveLength(24);
    expect(first.every(({ velocityY }) => velocityY > 0)).toBe(true);

    expect(fx.resolveCameraPunch(0)).toEqual({ distanceDelta: 0, fovDelta: 0 });
    expect(fx.resolveCameraPunch(120)).toEqual({ distanceDelta: -2, fovDelta: 1.5 });
    expect(fx.resolveCameraPunch(210)).toEqual({ distanceDelta: -1, fovDelta: 0.75 });
    expect(fx.resolveCameraPunch(300)).toEqual({ distanceDelta: 0, fovDelta: 0 });
    expect(fx.resolveCameraPunch(800)).toEqual({ distanceDelta: 0, fovDelta: 0 });

    const source = readAppFile("app/scene/Fx.tsx");
    expect(source).not.toContain("Math.random");
    expect(source).not.toMatch(/shake|wiggle/i);
    expect(source).toContain("static-effort-honored");
    expect(source).toContain("static-not-yet");
    expect(source).toContain("emittedSequence");
  });

  it("maps post-processing exactly by tier and damps bloom from the live value", async () => {
    const [postFx, tierA, tierB, tierC] = await Promise.all([
      importAppModule<PostFxModule>("app/scene/PostFx.tsx"),
      buildView("A"),
      buildView("B"),
      buildView("C"),
    ]);

    expect(postFx.buildPostFxPlan).toBeTypeOf("function");
    expect(postFx.dampScalar).toBeTypeOf("function");
    if (!postFx.buildPostFxPlan || !postFx.dampScalar) return;

    expect(postFx.buildPostFxPlan(tierA, HIGH_FEEDBACK)).toEqual({
      enabled: true,
      bloom: {
        threshold: 0.6,
        baselineIntensity: 0.7,
        peakIntensity: 1.4,
        radius: 0.4,
        mipmapBlur: true,
      },
      vignette: { offset: 0.3, darkness: 0.5 },
      smaa: true,
      pulseDelayMs: 120,
      pulseDurationMs: 800,
    });
    expect(postFx.buildPostFxPlan(tierB, HIGH_FEEDBACK)).toMatchObject({
      enabled: true,
      bloom: { peakIntensity: 1.4, mipmapBlur: false },
      vignette: null,
      smaa: false,
    });
    expect(postFx.buildPostFxPlan(tierC, HIGH_FEEDBACK)).toEqual({
      enabled: false,
      bloom: null,
      vignette: null,
      smaa: false,
      pulseDelayMs: 0,
      pulseDurationMs: 0,
    });

    const oneStep = postFx.dampScalar(0.7, 1.4, 5, 1);
    let sixtySteps = 0.7;
    for (let index = 0; index < 60; index += 1) {
      sixtySteps = postFx.dampScalar(sixtySteps, 1.4, 5, 1 / 60);
    }
    expect(sixtySteps).toBeCloseTo(oneStep, 10);
  });

  it("wires one feedback signal into the canvas, post-fx, and polite Ledger announcement", () => {
    const eventBus = readAppFile("app/scene/eventBus.ts");
    const client = readAppFile("app/ArenaClient.tsx");
    const canvas = readAppFile("app/scene/ArenaCanvas.tsx");
    const fx = readAppFile("app/scene/Fx.tsx");
    const postFx = readAppFile("app/scene/PostFx.tsx");
    const ledger = readAppFile("app/ledger/ArenaLedger.tsx");

    expect(eventBus).toContain('"learning-moment"');
    expect(client).toContain('subscribe("learning-moment"');
    expect(client).toContain("feedback={feedback}");
    expect(canvas).toContain("<Fx");
    expect(canvas).toContain("<PostFx");
    expect(fx).toContain("celebrationMotionSpec");
    expect(fx).toContain("resolveMotion");
    expect(fx).toContain("LAMBDAS");
    expect(postFx).toContain("EffectComposer");
    expect(postFx).toContain("<Bloom");
    expect(postFx).toContain("<Vignette");
    expect(postFx).toContain("<SMAA");
    expect(ledger).toContain('aria-live="polite"');
    expect(ledger).toContain('aria-atomic="true"');
    expect(ledger).toContain("soundCue.caption");
    expect(ledger).not.toMatch(/<audio|\.play\(/);
    expect(CATALOG).toHaveLength(9);
  });
});
