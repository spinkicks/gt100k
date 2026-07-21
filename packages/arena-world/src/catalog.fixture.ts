import type { Cosmetic } from "./model";

export const CATALOG = [
  {
    id: "avatar-hat-explorer",
    kind: "avatar-item",
    eligibility: { type: "min-tier", tierIndex: 1 },
    look: "soft tan felt explorer's cap",
    equipEffect: "tilts slightly on walk (reduced motion: static tilt)",
  },
  {
    id: "avatar-cape-aurora",
    kind: "avatar-item",
    eligibility: { type: "min-tier", tierIndex: 3 },
    look: "teal-to-plum aurora-gradient cape",
    equipEffect: "trails on run (reduced motion: static cape, no trail)",
  },
  {
    id: "avatar-badge-firstlight",
    kind: "avatar-item",
    eligibility: { type: "min-unlocks", count: 1 },
    look: "small gold first-light star pin",
    equipEffect: "glints (emissive) on idle (reduced motion: static pin)",
  },
  {
    id: "world-theme-dawn",
    kind: "world-theme",
    eligibility: { type: "min-unlocks", count: 3 },
    look: "rosier dawn sky and softer light",
    equipEffect:
      "recolors sky/sea and shifts the lighting rig on equip (reduced motion: instant recolor)",
  },
  {
    id: "world-theme-dusk",
    kind: "world-theme",
    eligibility: { type: "min-tier", tierIndex: 4 },
    look: "deep-indigo dusk with brighter lanterns and stars",
    equipEffect:
      "indigo ambient, beacons more prominent, and star cards twinkle (reduced motion: static stars, indigo rig)",
  },
  {
    id: "base-banner-unity",
    kind: "base-theme",
    eligibility: { type: "region-complete", region: "numbers-coast" },
    look: "co-signed cohort unity banner",
    equipEffect: "shows contributor marks (reduced motion: static banner)",
  },
  {
    id: "base-lantern-warm",
    kind: "base-theme",
    eligibility: { type: "min-tier", tierIndex: 2 },
    look: "warm lantern strings around camp",
    equipEffect: "gentle sway (reduced motion: static strings)",
  },
  {
    id: "celebration-bloom",
    kind: "celebration-effect",
    eligibility: { type: "min-unlocks", count: 1 },
    look: "unlock burst as flower-petal bloom",
    equipEffect: "changes particle shape (reduced motion: static petal badge)",
  },
  {
    id: "celebration-aurora",
    kind: "celebration-effect",
    eligibility: { type: "min-tier", tierIndex: 5 },
    look: "unlock burst as aurora ribbons with sky shimmer",
    equipEffect: "rarest sky one-shot (reduced motion: static ribbon badge)",
  },
] satisfies Cosmetic[];
