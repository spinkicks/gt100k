export const MOTION = {
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
} as const;

export const EASINGS = {
  enter: { three: "Cubic.Out", css: "cubic-bezier(0.23,1,0.32,1)" },
  move: { three: "Sine.InOut", css: "cubic-bezier(0.77,0,0.175,1)" },
  pop: "Back.Out",
  press: "Quad.Out",
  loop: "Sine.InOut",
  intro: "Cubic.InOut",
  linear: "Linear",
} as const;

export const LAMBDAS = {
  cameraFollow: 3.5,
  avatarMove: 6,
  avatarTurn: 8,
  beaconRise: 4,
  bloomPulse: 5,
  orbit: 0.08,
} as const;
