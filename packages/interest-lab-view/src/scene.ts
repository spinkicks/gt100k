import type { Camera3DView, QualityTier, RenderTier, Scene3DView } from "./model";

export const SCENE3D = {
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
} satisfies Scene3DView;

export const CAMERA3D = {
  fov: 42,
  near: 0.1,
  far: 100,
  home: {
    pos: [0, 4.5, 15],
    target: [0, 0.4, 0],
  },
  establishStart: {
    pos: [0, 7, 22],
  },
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
} satisfies Camera3DView;

export const QUALITY_TIERS = {
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
} as const satisfies Record<"full" | "lite" | "board2d", QualityTier>;

export const RENDER_TIERS = [
  "quest-world-3d",
  "quest-world-3d-lite",
  "board-2d",
] as const satisfies readonly RenderTier[];
