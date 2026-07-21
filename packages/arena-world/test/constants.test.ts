import { describe, expect, it } from "vitest";
import { PALETTE, TYPOGRAPHY } from "../src/art";
import { ASSET_KEYS } from "../src/assets";
import { EASINGS, LAMBDAS, MOTION } from "../src/motion";
import { QUALITY_TIERS } from "../src/quality";
import { CAMERA3D, LIGHTING, PARALLAX3D, POSTFX, WATER, WORLD_SCALE } from "../src/scene3d";
import { SOUND_CUES } from "../src/sound";

describe("arena-world golden constant registries", () => {
  it("defines the exact palette and typography tokens", () => {
    expect(PALETTE).toEqual({
      seaDeep: "#0E2A3B",
      seaMid: "#14384C",
      skyDawn: "#F4C77B",
      ink: "#14202B",
      inkHi: "#F5F9FC",
      sun: "#F6A23A",
      sunHi: "#FFC66B",
      gold: "#F2C14E",
      ember: "#E8623B",
      locked: "#5A6B78",
      notYet: "#7FB6D6",
      focus: "#FFD166",
    });
    expect(TYPOGRAPHY).toEqual({
      fontDisplay: '"Fredoka","Baloo 2",ui-rounded,"Segoe UI Rounded",system-ui,sans-serif',
      fontBody: '"Nunito",ui-rounded,system-ui,sans-serif',
      scale: {
        display: { rem: 2.5, lh: 1.05, ls: -0.02 },
        h1: { rem: 1.75, lh: 1.1, ls: -0.01 },
        h2: { rem: 1.25, lh: 1.2, ls: 0 },
        body: { rem: 1, lh: 1.5, ls: 0 },
        label: { rem: 0.8125, lh: 1.4, ls: 0.01 },
      },
      numeric: "tabular-nums",
    });
  });

  it("defines the exact scripted motion and damping registries", () => {
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

  it("defines the exact renderer-agnostic 3D scene registries", () => {
    expect(WORLD_SCALE).toBe(0.03125);
    expect(CAMERA3D).toEqual({
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
    });
    expect(LIGHTING).toEqual({
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
    });
    expect(PARALLAX3D).toEqual([
      { id: "sky", scrollFactor: 0 },
      { id: "clouds-far", scrollFactor: 0.15 },
      { id: "horizon", scrollFactor: 0.3 },
      { id: "sea", scrollFactor: 0.6 },
      { id: "world", scrollFactor: 1 },
      { id: "motes", scrollFactor: 1.05 },
      { id: "foreground", scrollFactor: 1.2 },
    ]);
    expect(WATER).toEqual({
      level: -3,
      baseHex: "#14384C",
      glintHex: "#FFD9A0",
      shimmerMs: 6000,
      foam: true,
    });
    expect(POSTFX).toEqual({
      bloom: { threshold: 0.6, intensity: 0.7, radius: 0.4, mipmapBlur: true },
      vignette: { offset: 0.3, darkness: 0.5 },
      smaa: true,
    });
  });

  it("defines the exact quality budgets and beacon-light caps", () => {
    expect(QUALITY_TIERS).toEqual({
      A: {
        tier: "A",
        dprMax: 2,
        shadows: "soft-pcf-2048",
        maxDynamicLights: 8,
        water: "shader",
        postfx: "bloom-vignette-smaa",
        ambientMotion: true,
        particleScale: 1,
        targetFps: 60,
        canvas: true,
      },
      B: {
        tier: "B",
        dprMax: 1.5,
        shadows: "pcf-1024",
        maxDynamicLights: 3,
        water: "cheap",
        postfx: "bloom",
        ambientMotion: true,
        particleScale: 0.5,
        targetFps: 60,
        canvas: true,
      },
      C: {
        tier: "C",
        dprMax: 1.5,
        shadows: "off",
        maxDynamicLights: 0,
        water: "static",
        postfx: "off",
        ambientMotion: false,
        particleScale: 0,
        targetFps: 60,
        canvas: true,
      },
      D: {
        tier: "D",
        dprMax: null,
        shadows: null,
        maxDynamicLights: 0,
        water: "2d",
        postfx: "off",
        ambientMotion: false,
        particleScale: 0,
        targetFps: null,
        canvas: false,
      },
    });
    expect(Object.keys(QUALITY_TIERS)).toEqual(["A", "B", "C", "D"]);
  });

  it("defines the exact stable asset-key registry", () => {
    expect(ASSET_KEYS).toEqual({
      avatar: ["av-body", "av-lantern", "av-hat", "av-cape", "av-badge"],
      nodes: ["node-locked", "node-available", "node-unlocked", "node-beacon"],
      regions: [
        "isle-numbers-coast",
        "isle-tinker-bluffs",
        "isle-story-vale",
        "isle-wordwind-reach",
        "water",
        "bridge",
      ],
      base: [
        "prop-campfire",
        "prop-banner",
        "prop-garden",
        "prop-dock",
        "prop-workshop",
        "prop-lookout",
      ],
      fx: ["fx-mote", "fx-petal", "fx-ribbon", "fx-star"],
      ui: ["ui-lock", "ui-star", "ui-home", "ui-audio", "ui-help"],
    });
  });

  it("defines exact neutral, muted-by-default sound cues", () => {
    expect(SOUND_CUES).toEqual({
      boot: { cueId: "boot-chime", caption: "[warm chime]", mutedByDefault: true },
      traverse: { cueId: "footfall", caption: "[soft step]", mutedByDefault: true },
      nodeAvailable: {
        cueId: "ready-shimmer",
        caption: "[ready shimmer]",
        mutedByDefault: true,
      },
      unlockMedium: {
        cueId: "bloom-chord",
        caption: "[unlock chime]",
        mutedByDefault: true,
      },
      unlockHigh: {
        cueId: "beacon-arpeggio",
        caption: "[beacon lights up]",
        mutedByDefault: true,
      },
      productiveStruggle: {
        cueId: "encourage-tone",
        caption: "[keep-going tone]",
        mutedByDefault: true,
      },
      notYet: { cueId: "soft-tap", caption: "[soft tap]", mutedByDefault: true },
      equip: { cueId: "cloth-whoosh", caption: "[cloth whoosh]", mutedByDefault: true },
      tierAdvance: {
        cueId: "rising-sweep",
        caption: "[tier up]",
        mutedByDefault: true,
      },
      baseAccretion: {
        cueId: "place-murmur",
        caption: "[placed]",
        mutedByDefault: true,
      },
    });

    expect(Object.keys(SOUND_CUES)).toEqual([
      "boot",
      "traverse",
      "nodeAvailable",
      "unlockMedium",
      "unlockHigh",
      "productiveStruggle",
      "notYet",
      "equip",
      "tierAdvance",
      "baseAccretion",
    ]);
    for (const cue of Object.values(SOUND_CUES)) {
      expect(Object.keys(cue).sort()).toEqual(["caption", "cueId", "mutedByDefault"]);
    }
  });

  it("preserves declaration order for every keyed registry", () => {
    expect(Object.keys(PALETTE)).toEqual([
      "seaDeep",
      "seaMid",
      "skyDawn",
      "ink",
      "inkHi",
      "sun",
      "sunHi",
      "gold",
      "ember",
      "locked",
      "notYet",
      "focus",
    ]);
    expect(Object.keys(TYPOGRAPHY)).toEqual(["fontDisplay", "fontBody", "scale", "numeric"]);
    expect(Object.keys(TYPOGRAPHY.scale)).toEqual(["display", "h1", "h2", "body", "label"]);
    expect(Object.keys(MOTION)).toEqual([
      "instant",
      "press",
      "micro",
      "fast",
      "reveal",
      "base",
      "zoom",
      "sceneFade",
      "runSeg",
      "celebrateLow",
      "move",
      "celebrateMed",
      "equip",
      "celebrateHigh",
      "lantern",
      "glowLoop",
      "intro",
      "idleBob",
      "particleLife",
      "islandFloat",
      "sunDrift",
    ]);
    expect(Object.keys(EASINGS)).toEqual([
      "enter",
      "move",
      "pop",
      "press",
      "loop",
      "intro",
      "linear",
    ]);
    expect(Object.keys(LAMBDAS)).toEqual([
      "cameraFollow",
      "avatarMove",
      "avatarTurn",
      "beaconRise",
      "bloomPulse",
      "orbit",
    ]);
    expect(Object.keys(CAMERA3D)).toEqual([
      "fov",
      "near",
      "far",
      "distanceDefault",
      "distanceRegion",
      "distanceMin",
      "distanceMax",
      "introDistance",
      "followLambda",
      "orbitDampingFactor",
      "orbitYawMinDeg",
      "orbitYawMaxDeg",
      "pitchMinDeg",
      "pitchMaxDeg",
      "deadzoneRadius",
      "lookAheadUnits",
      "punchDistDelta",
      "punchFovDelta",
      "punchOutMs",
      "punchBackMs",
      "restTarget",
    ]);
    expect(Object.keys(LIGHTING)).toEqual([
      "key",
      "hemi",
      "ambient",
      "rim",
      "sunDriftDeg",
      "sunDriftMs",
      "shadow",
      "beacon",
      "beaconTransfer",
      "availableGlow",
    ]);
    expect(Object.keys(WATER)).toEqual(["level", "baseHex", "glintHex", "shimmerMs", "foam"]);
    expect(Object.keys(POSTFX)).toEqual(["bloom", "vignette", "smaa"]);
    expect(Object.keys(ASSET_KEYS)).toEqual(["avatar", "nodes", "regions", "base", "fx", "ui"]);
  });
});
