"use client";

// "The Atelier at Golden Hour" — the Art cabin interior (art bible §7.2 / §8, the highest-bar room).
//
// A value/reference layer on the frozen ZonePlugin.Room3D contract: the room is described purely in
// atelier-scene.ts and RENDERED here with the §5 lighting recipe (warm window key + wood-stove +
// cool dusk hemisphere fill → no dead shadow), a procedural warm/cool IBL (no external HDRI/CDN, so
// the drei <Environment> "reading '0'" crash can't happen), the golden window shaft + dust motes,
// one frozen blue-violet contact shadow, and a lean Bloom→ACES→Vignette post chain.
//
// The 3 sorted zone actions bind to the room's live craft objects, in model order:
//   [0] Build (primary) → the grand easel's luminous periwinkle canvas  → the DOORWAY object
//   [1] Compose         → the Storybox on the drafting desk             → the "make" tickle
//   [2] Explain         → the half-finished glowing frame on the wall   → "your unfinished thing"
// Each is a real <mesh> that emits an ActivityEvent → changes window.__qa.state()/stateHash()
// (Pillar: no dead doorway, §11). AtelierRoom stays a pure function (no top-level hooks) so it is
// walkable in tests exactly like Island(); all hooks live in <AtelierStage>.

import type { ActivityEvent } from "@gt100k/interest-lab";
import { CABIN, SCENE3D, type ZoneActionModel, type ZoneId } from "@gt100k/interest-lab-view";
import type { RoomProps } from "@gt100k/interest-zone-kit";
import { BakeShadows, ContactShadows, PerspectiveCamera, Sparkles } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer, ToneMapping, Vignette } from "@react-three/postprocessing";
import { BlendFunction, ToneMappingMode } from "postprocessing";
import { type RefObject, useEffect, useMemo, useRef } from "react";
import { Color, type Mesh, type PointLight } from "three";
import { ProceduralEnvironment } from "../world3d/procedural-env";
import {
  type AtelierProp,
  type AtelierScene,
  type PropRole,
  buildAtelierScene,
} from "./atelier-scene";

const ZONE_ID: ZoneId = "art";

// Sorted-action index → the live craft object it drives (§8.2). Art sorts a_build/a_compose/a_explain.
const ROLE_BY_INDEX: readonly PropRole[] = ["easel-canvas", "storybox", "gallery-hero"];

const eventFor = (action: ZoneActionModel, dayOffset: number): ActivityEvent => ({
  zoneId: ZONE_ID,
  probeId: action.probeId,
  domain: action.domain,
  workMode: action.workMode,
  action: action.actionId,
  kind: action.kind,
  dayOffset,
});

// ── geometry + material elements (shared by decorative props and the literal action meshes) ──
function GeometryEl({ prop }: { prop: AtelierProp }) {
  const a = prop.args as number[];
  switch (prop.geom) {
    case "box":
      return <boxGeometry args={[a[0], a[1], a[2]]} />;
    case "cyl":
      return <cylinderGeometry args={[a[0], a[1], a[2], a[3] ?? 12]} />;
    case "cone":
      return <coneGeometry args={[a[0], a[1], a[2] ?? 8]} />;
    case "sphere":
      return <sphereGeometry args={[a[0], a[1] ?? 10, a[2] ?? 8]} />;
    default:
      return <planeGeometry args={[a[0], a[1]]} />;
  }
}

function MaterialEl({ prop }: { prop: AtelierProp }) {
  const bright = (prop.emissiveIntensity ?? 0) >= 1.2;
  return (
    <meshStandardMaterial
      color={prop.color}
      roughness={prop.roughness}
      metalness={prop.metalness}
      flatShading={prop.flat}
      {...(prop.emissive ? { emissive: prop.emissive, emissiveIntensity: prop.emissiveIntensity ?? 1 } : {})}
      {...(prop.opacity !== undefined ? { transparent: true, opacity: prop.opacity, depthWrite: false } : {})}
      {...(bright ? { toneMapped: false } : {})}
    />
  );
}

function PropMesh({ prop }: { prop: AtelierProp }) {
  return (
    <mesh
      position={prop.position as [number, number, number]}
      {...(prop.rotation ? { rotation: prop.rotation as [number, number, number] } : {})}
    >
      <GeometryEl prop={prop} />
      <MaterialEl prop={prop} />
    </mesh>
  );
}

// ── the golden shaft (the hero detail): SOFT feathered god-rays from the window ──
// Two nested open cones — a wide, barely-there halo + a slightly brighter narrower core — read as a
// soft volumetric beam rather than one hard opaque wedge. High radial segments keep the edge round.
function GoldenShaft({ shaft }: { shaft: AtelierScene["shaft"] }) {
  const pos = shaft.position as [number, number, number];
  const rot = shaft.rotation as [number, number, number];
  return (
    <group position={pos} rotation={rot}>
      <mesh>
        <coneGeometry args={[shaft.args[0] * 1.18, shaft.args[1], 20, 1, true]} />
        <meshStandardMaterial
          color={shaft.color}
          emissive={shaft.emissive}
          emissiveIntensity={shaft.emissiveIntensity * 0.7}
          transparent
          opacity={shaft.opacity * 0.55}
          depthWrite={false}
          toneMapped={false}
          roughness={1}
        />
      </mesh>
      <mesh>
        <coneGeometry args={[shaft.args[0] * 0.6, shaft.args[1], 20, 1, true]} />
        <meshStandardMaterial
          color={shaft.color}
          emissive={shaft.emissive}
          emissiveIntensity={shaft.emissiveIntensity}
          transparent
          opacity={shaft.opacity}
          depthWrite={false}
          toneMapped={false}
          roughness={1}
        />
      </mesh>
    </group>
  );
}

// Sets the main scene's background to the warm golden-hour haze (attach="background" on a nested
// <color> would target the group, not the scene). Only runs in a real Canvas mount.
function SceneBackground({ color }: { color: string }) {
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    const previous = scene.background;
    scene.background = new Color(color);
    return () => {
      scene.background = previous;
    };
  }, [scene, color]);
  return null;
}

// ── the mounted, hooked stage: camera · lights · IBL · dressing · shaft · motes · shadow · post + motion ──
function AtelierStage({ scene, reducedMotion }: { scene: AtelierScene; reducedMotion: boolean }) {
  const decorative = useMemo(() => scene.props.filter((p) => p.role === undefined), [scene]);
  const fireboxRef = useRef<Mesh>(null);
  const flameRef = useRef<Mesh>(null);
  const fireLightRef = useRef<PointLight>(null);
  const catRef = useRef<Mesh>(null);
  const plantRef = useRef<Mesh>(null);
  const t = useRef(0);
  const invalidate = useThree((s) => s.invalidate);

  // Paint a COMPLETE, settled still even when the animation loop never runs. Under
  // frameloop="demand" the scene only repaints on invalidate(); the motion useFrame supplies that
  // during motion, but under reduced-motion it early-returns — so without this the room freezes on
  // its blank pre-settle first frame (a §11 broken still). Only under reduced-motion, pump a
  // bounded burst of invalidations so the camera, PMREM IBL (assigned in ProceduralEnv's effect),
  // the frozen contact shadow and the post chain fully resolve, then stop → an instant calm still
  // at ~0 ongoing GPU. Deferred one rAF so the env/scene effects have committed before the burst.
  useEffect(() => {
    if (!reducedMotion) return; // the motion path already settles via the useFrame loop
    let frame = 0;
    let raf = 0;
    const pump = () => {
      invalidate();
      if (++frame < 10) raf = requestAnimationFrame(pump);
    };
    const start = requestAnimationFrame(() => {
      raf = requestAnimationFrame(pump);
    });
    return () => {
      cancelAnimationFrame(start);
      cancelAnimationFrame(raf);
    };
  }, [invalidate, reducedMotion]);

  // Reduced-motion still safety: any event that can blank a demand-loop canvas (tab restore,
  // resize, DPR settle) must trigger a repaint, or the child is left on a cleared buffer. Cheap +
  // event-driven → still ~0 idle GPU. (The motion path self-heals via the useFrame loop below.)
  useEffect(() => {
    if (!reducedMotion || typeof window === "undefined") return;
    const repaint = () => invalidate();
    window.addEventListener("resize", repaint);
    document.addEventListener("visibilitychange", repaint);
    return () => {
      window.removeEventListener("resize", repaint);
      document.removeEventListener("visibilitychange", repaint);
    };
  }, [reducedMotion, invalidate]);

  // Ambient life (Pillar F): fire flicker · cat breathing · plant sway · drifting motes. Under
  // frameloop="demand" the loop self-sustains via invalidate(); reduced-motion never invalidates
  // → an instant, calm still frame (§F, §11 no essential motion under reduced-motion).
  useFrame((state, delta) => {
    if (reducedMotion) return;
    t.current += delta;
    const flicker = 2.6 + Math.sin(t.current * 11) * 0.5 + Math.sin(t.current * 23) * 0.25;
    if (fireboxRef.current) {
      const m = fireboxRef.current.material as { emissiveIntensity?: number };
      if (m.emissiveIntensity !== undefined) m.emissiveIntensity = flicker + 0.6;
    }
    if (flameRef.current) {
      flameRef.current.scale.y = 1 + Math.sin(t.current * 9) * 0.08;
    }
    if (fireLightRef.current) fireLightRef.current.intensity = 2.1 + flicker * 0.18;
    if (catRef.current) catRef.current.scale.setScalar(1 + Math.sin(t.current * 1.6) * 0.02);
    if (plantRef.current) plantRef.current.rotation.z = Math.sin(t.current * 0.8) * 0.06;
    state.invalidate();
  });

  return (
    <group>
      {/* Warm golden-hour haze fills the room box behind everything (never black/transparent). */}
      <SceneBackground color={SCENE3D.bgHex} />
      <PerspectiveCamera
        makeDefault
        position={scene.camera.pos as [number, number, number]}
        fov={scene.camera.fov}
        near={0.1}
        far={80}
      />

      {/* §5 lighting recipe — warm key(s) over a cool dusk-blue hemisphere fill (no dead shadow). */}
      {scene.lights.map((light, i) => {
        if (light.kind === "ambient") return <ambientLight key={i} color={light.color} intensity={light.intensity} />;
        if (light.kind === "hemisphere")
          return (
            <hemisphereLight key={i} color={light.color} groundColor={light.groundColor} intensity={light.intensity} />
          );
        if (light.kind === "directional")
          return (
            <directionalLight
              key={i}
              color={light.color}
              intensity={light.intensity}
              position={light.position as [number, number, number]}
            />
          );
        return (
          <pointLight
            key={i}
            ref={i === 3 ? fireLightRef : undefined}
            color={light.color}
            intensity={light.intensity}
            position={light.position as [number, number, number]}
            distance={16}
            decay={2}
          />
        );
      })}

      {/* Procedural IBL — a warm window + hearth + a cool sky, baked once via PMREM (the §5.1
          cohesion lever) with NO drei <Environment> portal and NO external HDRI/CDN, so the
          "reading '0'" crash / blank-canvas race cannot happen (see procedural-env.tsx). */}
      <ProceduralEnvironment {...scene.env} intensity={0.9} />

      {/* Palette-matched warm fog for cohesion (never to hide the far clip, §5.7). */}
      <fog attach="fog" args={[SCENE3D.fogHex, 12, 34]} />

      {/* Dressing — every surface class, tinted to the §3 palette. The firebox/flame flicker, the
          plant sways, and the sleeping cat breathes (refs animate scale/rotation in-place). */}
      {decorative.map((prop) => {
        if (prop.key === "stove-firebox") return <RefMesh key={prop.key} prop={prop} meshRef={fireboxRef} />;
        if (prop.key === "stove-flame") return <RefMesh key={prop.key} prop={prop} meshRef={flameRef} />;
        if (prop.key === "plant-1") return <RefMesh key={prop.key} prop={prop} meshRef={plantRef} />;
        if (prop.key === "cat-body") return <RefMesh key={prop.key} prop={prop} meshRef={catRef} />;
        return <PropMesh key={prop.key} prop={prop} />;
      })}

      <GoldenShaft shaft={scene.shaft} />

      {/* Dust motes in the shaft — the soul of the room (§5). */}
      <Sparkles
        count={scene.motes.count}
        color={scene.motes.color}
        size={scene.motes.size}
        speed={reducedMotion ? 0 : scene.motes.speed}
        scale={scene.motes.scale as [number, number, number]}
        position={[-1.6, 2.6, -2.2]}
      />

      {/* ≤1 frozen shadow-caster: a blue-violet contact shadow grounds the room (Pillar B). */}
      <ContactShadows
        frames={1}
        position={[0, scene.shadow.y, 0]}
        scale={scene.shadow.scale}
        blur={scene.shadow.blur}
        opacity={scene.shadow.opacity}
        color={scene.shadow.color}
        far={8}
      />
      <BakeShadows />

      {/* Lean post: firelight/doorway bloom → ACES tone-map → gentle vignette (2–3 passes, §5.8). */}
      <EffectComposer multisampling={2}>
        <Bloom intensity={SCENE3D.bloomPeak * 0.7} luminanceThreshold={0.9} luminanceSmoothing={0.35} radius={0.8} mipmapBlur />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        <Vignette offset={0.3} darkness={0.44} blendFunction={BlendFunction.NORMAL} />
      </EffectComposer>
    </group>
  );
}

// A decorative prop whose mesh needs a ref (the animated firebox / flame).
function RefMesh({ prop, meshRef }: { prop: AtelierProp; meshRef: RefObject<Mesh> }) {
  return (
    <mesh
      ref={meshRef}
      position={prop.position as [number, number, number]}
      {...(prop.rotation ? { rotation: prop.rotation as [number, number, number] } : {})}
    >
      <GeometryEl prop={prop} />
      <MaterialEl prop={prop} />
    </mesh>
  );
}

// NOTE: AtelierRoom is a PURE function (no top-level hooks) so it is walkable as `AtelierRoom(props)`
// in tests exactly like Island(); every hook lives inside the mounted <AtelierStage>.
export function AtelierRoom({ actions, dayOffset, emit, reducedMotion }: RoomProps) {
  const scene = buildAtelierScene();
  const roleProps = new Map<PropRole, AtelierProp>();
  for (const p of scene.props) if (p.role) roleProps.set(p.role, p);

  // The live craft meshes — literal <mesh> in sorted-action order so window.__qa liveness + the
  // stub-parity contract hold (mesh[i] ⇒ actions[i]). Each glows with its domain hue (periwinkle).
  const actionMeshes = actions.slice(0, ROLE_BY_INDEX.length).map((action, index) => {
    const prop = roleProps.get(ROLE_BY_INDEX[index]!);
    if (!prop) return null;
    return (
      <mesh
        key={action.actionId}
        name={action.label}
        position={prop.position as [number, number, number]}
        {...(prop.rotation ? { rotation: prop.rotation as [number, number, number] } : {})}
        userData={{ action }}
        onClick={() => emit(eventFor(action, dayOffset))}
        onPointerOver={() => {
          if (typeof document !== "undefined") document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          if (typeof document !== "undefined") document.body.style.cursor = "auto";
        }}
      >
        <GeometryEl prop={prop} />
        <MaterialEl prop={prop} />
      </mesh>
    );
  });

  return (
    <group name="art-atelier-room">
      <AtelierStage scene={scene} reducedMotion={reducedMotion} />
      {actionMeshes}
    </group>
  );
}
