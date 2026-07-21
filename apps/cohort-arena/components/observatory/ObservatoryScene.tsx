"use client";

import type { CohortArenaView, Vec3 } from "@gt100k/cohort-arena-view";
import { Environment, Instance, Instances, Lightformer, Line, Sparkles } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import {
  Bloom,
  BrightnessContrast,
  EffectComposer,
  HueSaturation,
  Noise,
  Vignette,
} from "@react-three/postprocessing";
import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  AdditiveBlending,
  Color,
  Group,
  IcosahedronGeometry,
  MeshPhysicalMaterial,
  OctahedronGeometry,
  ShaderMaterial,
  Vector3,
} from "three";

import type { RenderTier3D } from "../performance/runtime.js";
import { resolveRenderSettings } from "../performance/runtime.js";
import { buildObservatoryScene, easeSceneProgress, resolveObservatoryMotion } from "./scene";

interface ObservatorySceneProps {
  readonly view: CohortArenaView;
  readonly transitionKind?: "compile" | "rollback";
  readonly renderTier?: RenderTier3D;
}

interface SceneResources {
  readonly starGeometry: IcosahedronGeometry;
  readonly starMaterial: MeshPhysicalMaterial;
  readonly badgeGeometry: OctahedronGeometry;
  readonly badgeMaterial: MeshPhysicalMaterial;
  readonly haloMaterial: ShaderMaterial;
}

// Floor halos as pooled light, not flat decals: a radial falloff (bright core -> transparent
// rim) additively blended over the void reads as genuine light on a surface. Fed by Bloom so
// the core blooms softly, cohesive with the emissive-gem language rather than a uniform disc.
const HALO_VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const HALO_FRAGMENT_SHADER = /* glsl */ `
  precision mediump float;
  varying vec2 vUv;
  uniform vec3 uColor;
  uniform float uOpacity;
  void main() {
    float d = length(vUv - 0.5) * 2.0;        // 0 at center -> 1 at rim
    if (d > 1.0) discard;                      // clean circular edge
    float glow = pow(1.0 - d, 1.8);            // soft radial falloff
    float core = smoothstep(0.42, 0.0, d);     // brighter pooled center
    float alpha = (glow * 0.55 + core * 0.6) * uOpacity;
    vec3 col = uColor * (0.85 + core * 0.75);
    gl_FragColor = vec4(col, alpha);
  }
`;

const HALO_BASE_OPACITY = 0.4;
const HALO_BREATH_AMPLITUDE = 0.09;
const HALO_BREATH_PERIOD_MS = 3600;

function toTuple(position: Vec3): [number, number, number] {
  return [position.x, position.y, position.z];
}

export function ObservatoryScene({
  view,
  transitionKind = "compile",
  renderTier = "full-3d",
}: ObservatorySceneProps) {
  const scene = useMemo(() => buildObservatoryScene(view, renderTier), [renderTier, view]);
  const renderSettings = resolveRenderSettings(renderTier);
  const motion = useMemo(() => resolveObservatoryMotion(view), [view]);
  const starRefs = useRef(new Map<string, Group>());
  const initialStarPositions = useRef(new Map<string, [number, number, number]>());
  const animationStarts = useRef(new Map<string, Vector3>());
  const transitionStartedAt = useRef<number | null>(null);
  const cameraStartedAt = useRef<number | null>(null);
  const cameraStart = useMemo(
    () =>
      new Vector3(
        view.constellation.camera.position.x,
        view.constellation.camera.position.y + 2,
        view.constellation.camera.position.z + 3,
      ),
    [view],
  );
  const cameraEnd = useMemo(
    () =>
      new Vector3(
        view.constellation.camera.position.x,
        view.constellation.camera.position.y,
        view.constellation.camera.position.z,
      ),
    [view],
  );
  const cameraTarget = useMemo(
    () =>
      new Vector3(
        view.constellation.camera.target.x,
        view.constellation.camera.target.y,
        view.constellation.camera.target.z,
      ),
    [view],
  );
  const resources = useMemo<SceneResources>(
    () => ({
      starGeometry: new IcosahedronGeometry(0.58 * view.presentation.markerScale, 2),
      // Hero learner stars: crafted emissive glass gems, not solid blobs. A lit core
      // still feeds Bloom, but the read now comes from a clearcoat fresnel highlight, a
      // thin-film iridescent rim, and genuine reflections of the crafted IBL environment
      // (envMapIntensity) — so grazing edges shimmer cool/violet instead of reading flat.
      starMaterial: new MeshPhysicalMaterial({
        color: view.presentation.palette.peerHi,
        emissive: view.presentation.palette.peer,
        emissiveIntensity: 0.5,
        metalness: 0,
        roughness: 0.12,
        clearcoat: 1,
        clearcoatRoughness: 0.16,
        iridescence: 0.7,
        iridescenceIOR: 1.32,
        iridescenceThicknessRange: [120, 440],
        sheen: 0.45,
        sheenColor: view.presentation.palette.peerHi,
        sheenRoughness: 0.55,
        envMapIntensity: 1.7,
        toneMapped: false,
      }),
      badgeGeometry: new OctahedronGeometry(0.32 * view.presentation.markerScale, 0),
      // Guarantee crystals: faceted cut gems. flatShading gives each octahedron face a
      // crisp normal so the IBL rig lands as distinct bevel glints; emissive is dialed
      // right back so the facets read from reflection + a light metallic sheen, not glow.
      badgeMaterial: new MeshPhysicalMaterial({
        color: view.presentation.palette.form,
        emissive: view.presentation.palette.form,
        emissiveIntensity: 0.34,
        metalness: 0.4,
        roughness: 0.26,
        clearcoat: 0.7,
        clearcoatRoughness: 0.28,
        iridescence: 0.4,
        iridescenceIOR: 1.28,
        envMapIntensity: 1.9,
        flatShading: true,
        toneMapped: false,
      }),
      haloMaterial: new ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        vertexShader: HALO_VERTEX_SHADER,
        fragmentShader: HALO_FRAGMENT_SHADER,
        uniforms: {
          uColor: { value: new Color(view.presentation.palette.floor) },
          uOpacity: { value: HALO_BASE_OPACITY },
        },
      }),
    }),
    [view.presentation.markerScale, view.presentation.palette],
  );

  const registerStar = useCallback(
    (ref: string) => (instance: unknown) => {
      if (instance instanceof Group) starRefs.current.set(ref, instance);
      else starRefs.current.delete(ref);
    },
    [],
  );

  const initialStarPosition = useCallback((star: (typeof scene.stars)[number]) => {
    const existing = initialStarPositions.current.get(star.ref);
    if (existing) return existing;
    const initial = toTuple(star.start);
    initialStarPositions.current.set(star.ref, initial);
    return initial;
  }, []);

  useEffect(() => {
    const nextStarts = new Map<string, Vector3>();
    for (const star of scene.stars) {
      const livePosition = starRefs.current.get(star.ref)?.position;
      nextStarts.set(
        star.ref,
        livePosition?.clone() ?? new Vector3(star.start.x, star.start.y, star.start.z),
      );
    }
    animationStarts.current = nextStarts;
    transitionStartedAt.current = null;
  }, [scene.stars]);

  useEffect(
    () => () => {
      resources.starGeometry.dispose();
      resources.starMaterial.dispose();
      resources.badgeGeometry.dispose();
      resources.badgeMaterial.dispose();
      resources.haloMaterial.dispose();
    },
    [resources],
  );

  useFrame(({ camera, clock }) => {
    const elapsedMs = clock.elapsedTime * 1_000;
    transitionStartedAt.current ??= elapsedMs;
    cameraStartedAt.current ??= elapsedMs;

    const transitionMotion = transitionKind === "rollback" ? motion.rollback : motion.compile;

    const transitionProgress =
      transitionMotion.durationMs === 0
        ? 1
        : Math.min(1, (elapsedMs - transitionStartedAt.current) / transitionMotion.durationMs);
    const transitionEased = easeSceneProgress(transitionMotion.easing, transitionProgress);
    const driftPeriod = Math.max(1, motion.drift.durationMs);

    for (const [index, star] of scene.stars.entries()) {
      const instance = starRefs.current.get(star.ref);
      if (!instance) continue;
      if (star.paused) continue;
      const start = animationStarts.current.get(star.ref) ?? new Vector3(...toTuple(star.start));
      const drift =
        transitionProgress === 1 && motion.drift.durationMs > 0
          ? Math.sin((elapsedMs / driftPeriod) * Math.PI * 2 + index * 0.62) * 0.14
          : 0;
      instance.position.set(
        start.x + (star.settled.x - start.x) * transitionEased,
        start.y + (star.settled.y - start.y) * transitionEased + drift,
        start.z + (star.settled.z - start.z) * transitionEased,
      );
      instance.rotation.y = (elapsedMs / driftPeriod) * Math.PI * 2 + index * 0.08;
    }

    const cameraProgress =
      motion.camera.durationMs === 0
        ? 1
        : Math.min(1, (elapsedMs - cameraStartedAt.current) / motion.camera.durationMs);
    camera.position.lerpVectors(
      cameraStart,
      cameraEnd,
      easeSceneProgress(motion.camera.easing, cameraProgress),
    );
    camera.lookAt(cameraTarget);

    // Floor light breathes so the pooled glow is never a static decal (frameloop is always).
    const haloOpacity = resources.haloMaterial.uniforms.uOpacity;
    if (haloOpacity) {
      haloOpacity.value =
        HALO_BASE_OPACITY +
        Math.sin((elapsedMs / HALO_BREATH_PERIOD_MS) * Math.PI * 2) * HALO_BREATH_AMPLITUDE;
    }
  });

  return (
    <>
      <fog
        attach="fog"
        args={[
          view.constellation.fog.color,
          view.constellation.fog.near,
          view.constellation.fog.far,
        ]}
      />
      <hemisphereLight
        args={[view.presentation.palette.peerHi, view.presentation.palette.deck, 0.42]}
      />
      <pointLight
        color={view.presentation.palette.peer}
        intensity={18}
        distance={70}
        position={[-18, 14, 18]}
      />
      <pointLight
        color={view.presentation.palette.floor}
        intensity={10}
        distance={55}
        position={[18, 8, -12]}
      />
      {/* Cool rim/back light so stars separate from the void as silhouettes. */}
      <directionalLight
        color={view.presentation.palette.peerHi}
        intensity={0.75}
        position={[-6, 15, -22]}
      />

      {/* Crafted image-based ambient — no HDRI fetch; art-directed to the palette so
          non-emissive crystals and halos catch real cool/violet reflections. */}
      <Environment resolution={256} frames={1}>
        <Lightformer
          form="ring"
          intensity={2.4}
          color={view.presentation.palette.peerHi}
          position={[0, 20, -16]}
          scale={[26, 26, 1]}
        />
        <Lightformer
          form="rect"
          intensity={1.2}
          color={view.presentation.palette.form}
          position={[-18, 8, 8]}
          scale={[12, 16, 1]}
        />
        <Lightformer
          form="rect"
          intensity={0.9}
          color={view.presentation.palette.pending}
          position={[18, 6, -8]}
          scale={[12, 16, 1]}
        />
        <Lightformer
          form="circle"
          intensity={0.5}
          color={view.presentation.palette.peer}
          position={[0, -12, 0]}
          scale={[34, 34, 1]}
        />
      </Environment>

      {/* Drifting dust motes / distant stars so the void is never static (full-3d only). */}
      {renderTier === "full-3d" ? (
        <Sparkles
          count={70}
          scale={[50, 20, 50]}
          size={2.2}
          speed={0.3}
          opacity={0.55}
          noise={1.5}
          color={view.presentation.palette.peerHi}
        />
      ) : null}

      {scene.caliperRadii.map((radius) => (
        <mesh key={radius} position={[0, -0.9, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius - 0.045, radius, 96]} />
          <meshBasicMaterial
            color={view.presentation.palette.peer}
            depthWrite={false}
            opacity={0.18}
            transparent
          />
        </mesh>
      ))}

      {scene.stars.map((star) => (
        <Line
          key={`field-${star.ref}`}
          points={[toTuple(star.start), toTuple(star.settled)]}
          color={view.presentation.palette.peer}
          depthWrite={false}
          lineWidth={0.5}
          opacity={0.08}
          transparent
        />
      ))}

      {scene.floorHalos.map((halo) => (
        <mesh
          key={`floor-${halo.cohortIndex}`}
          material={resources.haloMaterial}
          position={toTuple(halo.position)}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <circleGeometry args={[halo.radius, 64]} />
        </mesh>
      ))}

      <Instances
        geometry={resources.starGeometry}
        material={resources.starMaterial}
        limit={scene.stars.length}
        range={scene.stars.length}
        dispose={null}
      >
        {scene.stars.map((star) => (
          <Instance
            key={star.ref}
            ref={registerStar(star.ref)}
            color={
              star.paused
                ? view.presentation.palette.safeguard
                : star.state === "unassigned"
                  ? view.presentation.palette.pending
                  : view.presentation.palette.peerHi
            }
            position={initialStarPosition(star)}
          />
        ))}
      </Instances>

      <Instances
        geometry={resources.badgeGeometry}
        material={resources.badgeMaterial}
        limit={scene.badges.length}
        range={scene.badges.length}
        dispose={null}
      >
        {scene.badges.map((badge) => (
          <Instance
            key={`${badge.cohortIndex}-${badge.constraint}`}
            position={toTuple(badge.position)}
          />
        ))}
      </Instances>

      {/* Cinematic grade (full-3d only; degraded tier skips post for frame budget):
          glow -> saturation lift -> filmic contrast -> vignette framing -> fine grain. */}
      {renderSettings.bloom ? (
        <EffectComposer multisampling={renderSettings.antialias ? 4 : 0} enableNormalPass={false}>
          <Bloom intensity={0.55} luminanceThreshold={0.5} luminanceSmoothing={0.7} mipmapBlur />
          <HueSaturation saturation={0.12} />
          <BrightnessContrast brightness={0.015} contrast={0.14} />
          <Vignette offset={0.24} darkness={0.64} />
          <Noise premultiply opacity={0.045} />
        </EffectComposer>
      ) : null}
    </>
  );
}
