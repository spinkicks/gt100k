import type {
  CameraConfig3D,
  LightingConfig,
  ParallaxLayer,
  PostFxConfig,
  WaterConfig,
} from "./model";

export const WORLD_SCALE = 0.03125;

export const CAMERA3D = {
  fov: 42,
  near: 0.5,
  far: 400,
  distanceDefault: 32,
  distanceRegion: 24,
  distanceMin: 18,
  distanceMax: 60,
  introDistance: 90,
  followLambda: 3.5,
  orbitDampingFactor: 0.08,
  orbitYawMinDeg: -35,
  orbitYawMaxDeg: 35,
  pitchMinDeg: 22,
  pitchMaxDeg: 62,
  deadzoneRadius: 2,
  lookAheadUnits: 3,
  punchDistDelta: -2,
  punchFovDelta: 1.5,
  punchOutMs: 120,
  punchBackMs: 180,
  restTarget: { x: 32, y: 0.5, z: 32 },
} satisfies CameraConfig3D;

export const LIGHTING = {
  key: {
    type: "directional",
    dir: { x: -0.6, y: 0.7, z: 0.35 },
    colorHex: "#FFD9A0",
    intensity: 2.4,
    castShadow: true,
  },
  hemi: { skyHex: "#F4C77B", groundHex: "#0E2A3B", intensity: 0.6 },
  ambient: { colorHex: "#14384C", intensity: 0.25 },
  rim: {
    type: "directional",
    dir: { x: 0.5, y: 0.3, z: -0.7 },
    colorHex: "#7FB6D6",
    intensity: 0.5,
  },
  sunDriftDeg: 5,
  sunDriftMs: 120000,
  shadow: { mapSize: 2048, bias: -0.0004, soft: true },
  beacon: { colorHex: "#F2C14E", intensity: 2, distance: 8, decay: 2 },
  beaconTransfer: { colorHex: "#E8623B", intensity: 2.6, distance: 10, decay: 2 },
  availableGlow: { colorHex: "#F6A23A", intensity: 0.6, distance: 5, decay: 2 },
} satisfies LightingConfig;

export const PARALLAX3D = [
  { id: "sky", scrollFactor: 0 },
  { id: "clouds-far", scrollFactor: 0.15 },
  { id: "horizon", scrollFactor: 0.3 },
  { id: "sea", scrollFactor: 0.6 },
  { id: "world", scrollFactor: 1 },
  { id: "motes", scrollFactor: 1.05 },
  { id: "foreground", scrollFactor: 1.2 },
] satisfies ParallaxLayer[];

export const WATER = {
  level: -3,
  baseHex: "#14384C",
  glintHex: "#FFD9A0",
  shimmerMs: 6000,
  foam: true,
} satisfies Omit<WaterConfig, "mode">;

export const POSTFX = {
  bloom: { threshold: 0.6, intensity: 0.7, radius: 0.4, mipmapBlur: true },
  vignette: { offset: 0.3, darkness: 0.5 },
  smaa: true,
} satisfies PostFxConfig;
