"use client";

// Portal-free procedural IBL — the r3f-pitfall-safe replacement for the drei <Environment> portal.
//
// drei's <Environment> (even with Lightformer children, no preset/CDN) mounts an <EnvironmentPortal>
// whose cube-camera setup intermittently throws `TypeError: Cannot read properties of undefined
// (reading '0')` when a render / invalidate() races its initialization. Once r3f's error boundary
// catches it, the whole Canvas subtree unmounts to a BLANK frame — worst under frameloop="demand"
// (a settle pump or a below-the-fold canvas invalidates mid-mount). See the react-three-fiber skill,
// references/pitfalls.md → "The <Environment> 'reading 0' crash".
//
// Instead we bake a tiny equirect gradient — a cool sky above → warm floor bounce below, with a warm
// key band left + right (the golden-hour cohesion lever, art bible §5.1) — through a PMREMGenerator
// ONCE and assign it to scene.environment. No portal, no cube camera, no per-frame render, no race.

import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import {
  Color,
  DataTexture,
  EquirectangularReflectionMapping,
  FloatType,
  LinearFilter,
  PMREMGenerator,
  RGBAFormat,
} from "three";

const ENV_W = 64;
const ENV_H = 32;

export interface ProceduralEnvColors {
  /** Cool fill from above (dusk skylight) — keeps shadows blue-violet, never dead (Pillar B). */
  cool: string;
  /** Warm horizon glow (the golden-hour band the room bathes in). */
  warm: string;
  /** Warm floor bounce from below (terracotta / walnut). */
  floor: string;
  /** Warm key band, left (the window / beacon). */
  accentL: string;
  /** Warm key band, right (the hearth / spark). */
  accentR: string;
}

/**
 * Build a small equirectangular gradient env texture (linear float, IBL-correct). Cool sky at the
 * top, warm floor at the bottom, warm key bands peaking at the horizon on the left + right.
 */
export function buildEnvEquirect({ cool, warm, floor, accentL, accentR }: ProceduralEnvColors): DataTexture {
  const data = new Float32Array(ENV_W * ENV_H * 4);
  const cCool = new Color(cool); // three converts hex sRGB → linear working values (correct for IBL)
  const cWarm = new Color(warm);
  const cFloor = new Color(floor);
  const cL = new Color(accentL);
  const cR = new Color(accentR);
  const px = new Color();
  for (let y = 0; y < ENV_H; y += 1) {
    const v = y / (ENV_H - 1); // 0 = top (cool sky) → 1 = bottom (warm floor bounce)
    const horizon = Math.max(0, 1 - Math.abs(v - 0.5) * 4); // warm key bands peak at the horizon
    for (let x = 0; x < ENV_W; x += 1) {
      const u = x / (ENV_W - 1); // longitude
      if (v < 0.5) px.copy(cCool).lerp(cWarm, v / 0.5);
      else px.copy(cWarm).lerp(cFloor, (v - 0.5) / 0.5);
      const left = Math.max(0, 1 - Math.abs(u - 0.28) * 5) * horizon * 0.5;
      const right = Math.max(0, 1 - Math.abs(u - 0.72) * 5) * horizon * 0.4;
      px.lerp(cL, left).lerp(cR, right);
      const i = (y * ENV_W + x) * 4;
      data[i] = px.r;
      data[i + 1] = px.g;
      data[i + 2] = px.b;
      data[i + 3] = 1;
    }
  }
  const tex = new DataTexture(data, ENV_W, ENV_H, RGBAFormat, FloatType);
  tex.mapping = EquirectangularReflectionMapping;
  tex.magFilter = LinearFilter;
  tex.minFilter = LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

export interface ProceduralEnvironmentProps extends ProceduralEnvColors {
  /** scene.environmentIntensity (drei <Environment environmentIntensity> equivalent). */
  intensity?: number;
}

/**
 * Assign a baked PMREM environment to the scene (once, on mount). Must be a child of <Canvas>.
 * Drop-in, crash-free replacement for `<Environment>…<Lightformer/></Environment>`.
 */
export function ProceduralEnvironment({ intensity = 1, ...colors }: ProceduralEnvironmentProps) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    const pmrem = new PMREMGenerator(gl);
    pmrem.compileEquirectangularShader();
    const src = buildEnvEquirect(colors);
    const rt = pmrem.fromEquirectangular(src);
    const prevEnv = scene.environment;
    const prevIntensity = scene.environmentIntensity;
    scene.environment = rt.texture;
    scene.environmentIntensity = intensity;
    src.dispose();
    pmrem.dispose();
    invalidate();
    return () => {
      scene.environment = prevEnv;
      scene.environmentIntensity = prevIntensity;
      rt.dispose();
    };
    // colors are primitive strings; spreading them keeps the dep list stable + exhaustive.
  }, [gl, scene, invalidate, intensity, colors.cool, colors.warm, colors.floor, colors.accentL, colors.accentR]);
  return null;
}
