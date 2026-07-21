import type { BiomeIdentity } from "./model";

export const BIOMES = [
  {
    region: "numbers-coast",
    name: "Numbers Coast",
    signatureHex: "#2EC4B6",
    terrainHex: "#E9D9A8",
    ambientHex: "#BFE9E3",
    elevation: 0,
    landmarks: ["Counting Lighthouse", "Abacus Jetty", "Tide-Pool Terraces"],
  },
  {
    region: "tinker-bluffs",
    name: "Tinker Bluffs",
    signatureHex: "#C77D3A",
    terrainHex: "#8A6B4F",
    ambientHex: "#E7C9A0",
    elevation: 1.5,
    landmarks: ["Gear Overlook", "Gadget Workshop", "Copper Kilns"],
  },
  {
    region: "story-vale",
    name: "Story Vale",
    signatureHex: "#3E9B5F",
    terrainHex: "#6E8E5A",
    ambientHex: "#CDE3B8",
    elevation: -0.5,
    landmarks: ["Whispering Falls", "Book-Root Forest", "The Open Page"],
  },
  {
    region: "wordwind-reach",
    name: "Wordwind Reach",
    signatureHex: "#5AA9E6",
    terrainHex: "#C9B27E",
    ambientHex: "#DCE9F5",
    elevation: 2.2,
    landmarks: ["Letter Landing Field", "Windmill Highlands", "The Spelling Spires"],
  },
] satisfies BiomeIdentity[];
