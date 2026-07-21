"use client";

import type { Palette, QualityBudget, WaterConfig } from "@gt100k/arena-world";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { BackSide, Color, type Group, type ShaderMaterial } from "three";

const WATER_SIZE = 96;
const SKY_RADIUS = 180;

const CLOUDS = [
  { position: [8, 18, 5], scale: [9, 3.5, 1] },
  { position: [26, 21, -8], scale: [12, 4, 1] },
  { position: [48, 17, 8], scale: [10, 3, 1] },
  { position: [67, 22, 32], scale: [13, 4.5, 1] },
  { position: [19, 19, 69], scale: [11, 3.5, 1] },
] as const;

const MOTES = [
  [8, 5, 14],
  [14, 8, 42],
  [21, 4, 61],
  [27, 10, 26],
  [33, 6, 51],
  [38, 9, 9],
  [44, 5, 35],
  [49, 11, 58],
  [55, 7, 19],
  [60, 4, 45],
  [66, 9, 30],
  [72, 6, 64],
] as const;

const SKY_VERTEX_SHADER = /* glsl */ `
  varying float vDirectionY;

  void main() {
    vDirectionY = normalize(position).y;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SKY_FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uHorizonColor;
  uniform vec3 uVoidColor;
  varying float vDirectionY;

  void main() {
    float horizonBand = 1.0 - smoothstep(0.04, 0.72, abs(vDirectionY));
    vec3 color = mix(uVoidColor, uHorizonColor, horizonBand);
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const WATER_VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uWaveAmplitude;
  varying float vWave;
  varying vec2 vUv;
  #include <fog_pars_vertex>

  void main() {
    vUv = uv;
    vec3 transformed = position;
    float wave = sin(position.x * 0.28 + uTime) * cos(position.y * 0.22 + uTime * 0.7);
    transformed.z += wave * uWaveAmplitude;
    vWave = wave;
    vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;

const WATER_FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uBaseColor;
  uniform vec3 uGlintColor;
  uniform float uFoam;
  varying float vWave;
  varying vec2 vUv;
  #include <fog_pars_fragment>

  void main() {
    float glint = smoothstep(0.2, 1.0, vWave) * 0.24;
    float ripple = sin((vUv.x + vUv.y) * 64.0 + vWave * 2.0) * 0.5 + 0.5;
    float foam = uFoam * smoothstep(0.93, 1.0, ripple) * 0.08;
    vec3 color = mix(uBaseColor, uGlintColor, glint + foam);
    gl_FragColor = vec4(color, 0.96);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    #include <fog_fragment>
  }
`;

export interface AtmospherePlan {
  skyHex: string;
  fogHex: string;
  waterMode: WaterConfig["mode"];
  waterVisible: boolean;
  cloudsVisible: true;
  motesVisible: true;
  ambientMotion: boolean;
}

export function resolveAtmospherePlan(
  palette: Palette,
  water: WaterConfig,
  qualityBudget: QualityBudget,
  reducedMotion: boolean,
): AtmospherePlan {
  return {
    skyHex: palette.skyDawn,
    fogHex: palette.seaDeep,
    waterMode: water.mode,
    waterVisible: water.mode !== "none",
    cloudsVisible: true,
    motesVisible: true,
    ambientMotion: qualityBudget.ambientMotion && !reducedMotion,
  };
}

interface SkyDomeProps {
  horizonHex: string;
  voidHex: string;
}

function SkyDome({ horizonHex, voidHex }: SkyDomeProps) {
  const uniforms = useMemo(
    () => ({
      uHorizonColor: { value: new Color(horizonHex) },
      uVoidColor: { value: new Color(voidHex) },
    }),
    [horizonHex, voidHex],
  );

  return (
    <mesh position={[32, 0, 32]}>
      <sphereGeometry args={[SKY_RADIUS, 24, 12]} />
      <shaderMaterial
        fragmentShader={SKY_FRAGMENT_SHADER}
        side={BackSide}
        uniforms={uniforms}
        vertexShader={SKY_VERTEX_SHADER}
      />
    </mesh>
  );
}

interface WaterSurfaceProps {
  water: WaterConfig;
  ambientMotion: boolean;
}

function WaterSurface({ water, ambientMotion }: WaterSurfaceProps) {
  const shader = useRef<ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uWaveAmplitude: { value: water.mode === "shader" ? 0.18 : 0.06 },
      uBaseColor: { value: new Color(water.baseHex) },
      uGlintColor: { value: new Color(water.glintHex) },
      uFoam: { value: water.foam ? 1 : 0 },
    }),
    [water.baseHex, water.foam, water.glintHex, water.mode],
  );

  useFrame(({ clock }) => {
    const material = shader.current;
    const timeUniform = material?.uniforms.uTime;
    if (!timeUniform) return;

    timeUniform.value = ambientMotion
      ? (((clock.elapsedTime * 1_000) % water.shimmerMs) / water.shimmerMs) * Math.PI * 2
      : 0;
  });

  if (water.mode === "none") return null;

  return (
    <mesh
      position={[32, water.level, 32]}
      receiveShadow={water.mode !== "static"}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <planeGeometry
        args={[
          WATER_SIZE,
          WATER_SIZE,
          water.mode === "shader" ? 48 : 1,
          water.mode === "shader" ? 48 : 1,
        ]}
      />
      {water.mode === "static" ? (
        <meshStandardMaterial
          color={water.baseHex}
          emissive={water.glintHex}
          emissiveIntensity={0.05}
          metalness={0.05}
          roughness={0.82}
        />
      ) : (
        <shaderMaterial
          ref={shader}
          fog
          fragmentShader={WATER_FRAGMENT_SHADER}
          transparent
          uniforms={uniforms}
          vertexShader={WATER_VERTEX_SHADER}
        />
      )}
    </mesh>
  );
}

interface AmbientLayerProps {
  ambientMotion: boolean;
  colorHex: string;
}

function CloudCards({ ambientMotion, colorHex }: AmbientLayerProps) {
  const clouds = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (!clouds.current) return;
    clouds.current.position.x = ambientMotion
      ? Math.sin((clock.elapsedTime / 120) * Math.PI * 2) * 3
      : 0;
  });

  return (
    <group ref={clouds} name="arena-clouds-far">
      {CLOUDS.map(({ position, scale }, index) => (
        <mesh
          key={`${position[0]}:${position[2]}`}
          position={position}
          rotation={[-Math.PI / 2, 0, index % 2 === 0 ? 0.08 : -0.08]}
          scale={scale}
        >
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial color={colorHex} depthWrite={false} opacity={0.16} transparent />
        </mesh>
      ))}
    </group>
  );
}

function AmbientMotes({ ambientMotion, colorHex }: AmbientLayerProps) {
  const motes = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (!motes.current) return;
    motes.current.position.y = ambientMotion ? Math.sin(clock.elapsedTime * 0.45) * 0.18 : 0;
  });

  return (
    <group ref={motes} name="arena-motes">
      {MOTES.map((position, index) => (
        <mesh key={`${position[0]}:${position[2]}`} position={position}>
          <sphereGeometry args={[index % 3 === 0 ? 0.1 : 0.065, 5, 4]} />
          <meshBasicMaterial
            color={colorHex}
            depthWrite={false}
            opacity={index % 3 === 0 ? 0.7 : 0.48}
            toneMapped={false}
            transparent
          />
        </mesh>
      ))}
    </group>
  );
}

export interface SeaAndSkyProps {
  palette: Palette;
  water: WaterConfig;
  qualityBudget: QualityBudget;
  reducedMotion: boolean;
}

export default function SeaAndSky({
  palette,
  water,
  qualityBudget,
  reducedMotion,
}: SeaAndSkyProps) {
  const plan = resolveAtmospherePlan(palette, water, qualityBudget, reducedMotion);

  return (
    <>
      <color attach="background" args={[plan.fogHex]} />
      <fog attach="fog" args={[plan.fogHex, 72, SKY_RADIUS]} />
      <SkyDome horizonHex={plan.skyHex} voidHex={plan.fogHex} />
      {plan.cloudsVisible ? (
        <CloudCards ambientMotion={plan.ambientMotion} colorHex={palette.inkHi} />
      ) : null}
      {plan.waterVisible ? <WaterSurface ambientMotion={plan.ambientMotion} water={water} /> : null}
      {plan.motesVisible ? (
        <AmbientMotes ambientMotion={plan.ambientMotion} colorHex={palette.sunHi} />
      ) : null}
    </>
  );
}
