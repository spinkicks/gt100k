"use client";
/**
 * The R3F cosmos (§U5.2 / §U8.9 / §U8.13) — the graph rendered as a navigable 3D constellation that
 * shares the **same** deterministic `ExplorerView` as the calm-2D tier. Procedural bodies + light-
 * thread edges + a seeded starfield, lit with a low-key key + cool rim, graded with the golden
 * bloom / depth-of-field / vignette (cinematic tier only). Orbit + dolly + damped momentum via drei;
 * a gentle auto-orbit gives the "camera flying slowly between worlds" idle in cinematic.
 *
 * The `<Canvas>` is `aria-hidden` — it is a decorative view of state that the accessible Ledger and
 * the calm-2D tier already express in text (colour is never the sole cue). `drei`
 * `PerformanceMonitor.onDecline` steps the tier down so the 60fps budget self-heals (SC-E21).
 */
import { CAMERA, type ExplorerView, type RenderTier } from "@gt100k/evidence-explorer-view";
import { OrbitControls, PerformanceMonitor } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Bloom, DepthOfField, EffectComposer, Vignette } from "@react-three/postprocessing";
import type { JSX } from "react";
import { Bodies } from "./Bodies.js";
import { Starfield } from "./Starfield.js";
import { Threads } from "./Threads.js";
import { COSMOS } from "./palette.js";

const DEG = Math.PI / 180;

/** §U8.13 atmosphere tokens (exact) — applied only on the cinematic tier. */
const BLOOM = {
  intensity: 1.15,
  luminanceThreshold: 0.62,
  luminanceSmoothing: 0.9,
  mipmapBlur: true,
} as const;
const DOF = { focalLength: 0.02, bokehScale: 2.4 } as const;

export function Cosmos3D({
  view,
  tier,
  onDegrade,
}: {
  view: ExplorerView;
  tier: RenderTier;
  onDegrade?: () => void;
}): JSX.Element {
  const cinematic = tier === "cinematic";
  const [cx, cy, cz] = view.center3d;
  const { overview } = CAMERA.keyframes;
  const { clamps } = CAMERA;

  return (
    <Canvas
      aria-hidden="true"
      dpr={[1, 2]}
      gl={{ antialias: true, powerPreference: "high-performance", alpha: false }}
      camera={{ position: [...overview.position], fov: overview.fov, near: 0.1, far: 400 }}
      style={{ width: "100%", height: "100%", display: "block" }}
    >
      <color attach="background" args={[COSMOS.void]} />
      <fog attach="fog" args={[COSMOS.void, 55, 200]} />

      {/* Lighting — deep ambient + a cool key + a warm rim for readable, non-flat bodies. */}
      <ambientLight intensity={0.35} color={COSMOS.inkMuted} />
      <directionalLight position={[18, 30, 26]} intensity={1.15} color={COSMOS.focus} />
      <pointLight position={[-10, -6, -18]} intensity={0.7} color={COSMOS.human} distance={140} />

      <Starfield animate={cinematic} />
      <Threads edges={view.edges} nodes={view.nodes} />
      <Bodies nodes={view.nodes} animate={cinematic} />

      <OrbitControls
        target={[cx, cy, cz]}
        enableDamping
        dampingFactor={0.08}
        enablePan={false}
        minDistance={clamps.dollyMin}
        maxDistance={clamps.dollyMax}
        minPolarAngle={clamps.orbitPolarMin * DEG}
        maxPolarAngle={clamps.orbitPolarMax * DEG}
        autoRotate={cinematic}
        autoRotateSpeed={0.35}
      />

      {onDegrade ? <PerformanceMonitor onDecline={() => onDegrade()} /> : null}

      {cinematic ? (
        <EffectComposer>
          <Bloom
            intensity={BLOOM.intensity}
            luminanceThreshold={BLOOM.luminanceThreshold}
            luminanceSmoothing={BLOOM.luminanceSmoothing}
            mipmapBlur={BLOOM.mipmapBlur}
          />
          <DepthOfField
            target={[cx, cy, cz]}
            focalLength={DOF.focalLength}
            bokehScale={DOF.bokehScale}
          />
          <Vignette eskil={false} offset={0.28} darkness={0.72} />
        </EffectComposer>
      ) : (
        <></>
      )}
    </Canvas>
  );
}
