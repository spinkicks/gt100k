/**
 * Deterministic URL params for the harness: ?seed &?cam=x,y,z,yaw,pitch[,fov] &?preset &?freeze &?hud.
 * When `cam` is present the app pins that exact pose (no free camera) so shots are frame-comparable;
 * when `freeze` is set, time-varying effects (fire flicker, cat idle) settle to a fixed phase.
 * Stack-agnostic.
 */

export type Preset = "low" | "high";

export interface CamPose {
  x: number;
  y: number;
  z: number;
  yaw: number;
  pitch: number;
  fov: number;
}

export interface Params {
  seed: number;
  cam: CamPose | null;
  preset: Preset;
  freeze: boolean;
  hud: boolean;
  /** gadget ids to force into their showcase (activated) state, or ["all"]; drives "after" shots */
  act: string[];
  /** debug/test: open a gadget's code-challenge overlay on load (e.g. ?challenge=lamp) */
  challenge: string | null;
}

/** FNV-1a → a stable 32-bit seed from a string or numeric string. */
export function hashSeed(input: string | number): number {
  const s = String(input);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Parse ?seed &?cam=x,y,z,yaw,pitch[,fov] &?preset &?freeze &?hud. */
export function parseParams(search: string = location.search): Params {
  const q = new URLSearchParams(search);

  const rawSeed = q.get("seed");
  const seed = rawSeed === null ? 1337 : hashSeed(rawSeed);

  let cam: CamPose | null = null;
  const camStr = q.get("cam");
  if (camStr) {
    const p = camStr.split(",").map(Number);
    if (p.length >= 5 && p.every((n) => Number.isFinite(n))) {
      cam = { x: p[0]!, y: p[1]!, z: p[2]!, yaw: p[3]!, pitch: p[4]!, fov: p[5] ?? 60 };
    }
  }

  const preset: Preset = q.get("preset") === "low" ? "low" : "high";

  const actStr = q.get("act");
  const act = actStr ? actStr.split(",").filter(Boolean) : [];

  return {
    seed,
    cam,
    preset,
    freeze: q.get("freeze") === "1",
    hud: q.get("hud") === "1",
    act,
    challenge: q.get("challenge"),
  };
}
