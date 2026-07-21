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
import {
  CAMERA,
  type ExplorerView,
  type RenderTier,
  SPRINGS,
  type Vec3,
} from "@gt100k/evidence-explorer-view";
import { OrbitControls, PerformanceMonitor } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, DepthOfField, EffectComposer, Vignette } from "@react-three/postprocessing";
import { useMemo, useRef } from "react";
import type { JSX } from "react";
import * as THREE from "three";
import { Bodies } from "./Bodies.js";
import { Starfield } from "./Starfield.js";
import { Threads } from "./Threads.js";
import { COSMOS } from "./palette.js";

const DEG = Math.PI / 180;

/**
 * Camera fly-to (§U5.4 / §U8.9) — damps the orbit target toward a selected body (or back to the
 * milestone center) so selecting a beat "flies" to its world. Distance stays under the user's dolly;
 * this is a look-ahead rack toward the body, not a jump-cut. Uses the golden `focusDampLambda`.
 */
function CameraRig({ focus, fallback }: { focus: Vec3 | null; fallback: Vec3 }): null {
  // OrbitControls registers itself as the default `controls` (makeDefault below).
  // Damp the target only; drei's OrbitControls (enableDamping) calls `update()` itself each frame,
  // so we avoid a second update() that would double the auto-rotate step.
  const controls = useThree((s) => s.controls) as { target: THREE.Vector3 } | null;
  useFrame((_, delta) => {
    if (!controls) return;
    const [gx, gy, gz] = focus ?? fallback;
    const lambda = SPRINGS.focusDampLambda;
    controls.target.x = THREE.MathUtils.damp(controls.target.x, gx, lambda, delta);
    controls.target.y = THREE.MathUtils.damp(controls.target.y, gy, lambda, delta);
    controls.target.z = THREE.MathUtils.damp(controls.target.z, gz, lambda, delta);
  });
  return null;
}

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
  revealed,
  focusNodeId = null,
}: {
  view: ExplorerView;
  tier: RenderTier;
  onDegrade?: () => void;
  /** Time-scrub reveal set; omitted = fully grown. */
  revealed?: ReadonlySet<string>;
  focusNodeId?: string | null;
}): JSX.Element {
  const cinematic = tier === "cinematic";
  const [cx, cy, cz] = view.center3d;
  const { overview } = CAMERA.keyframes;
  const { clamps } = CAMERA;

  const visibleNodes = useMemo(
    () => (revealed ? view.nodes.filter((n) => revealed.has(n.id)) : view.nodes),
    [view.nodes, revealed],
  );
  const visibleEdges = useMemo(
    () =>
      revealed ? view.edges.filter((e) => revealed.has(e.from) && revealed.has(e.to)) : view.edges,
    [view.edges, revealed],
  );
  const focusPos: Vec3 | null = useMemo(() => {
    if (!focusNodeId) return null;
    return view.nodes.find((n) => n.id === focusNodeId)?.pos3d ?? null;
  }, [view.nodes, focusNodeId]);

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
      <Threads edges={visibleEdges} nodes={visibleNodes} />
      <Bodies nodes={visibleNodes} animate={cinematic} />

      <OrbitControls
        makeDefault
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
      <CameraRig focus={focusPos} fallback={[cx, cy, cz]} />

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
