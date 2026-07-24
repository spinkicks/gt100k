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
import { Environment, Lightformer, OrbitControls, PerformanceMonitor } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, DepthOfField, EffectComposer, N8AO, Vignette } from "@react-three/postprocessing";
import { useMemo, useRef } from "react";
import type { JSX } from "react";
import * as THREE from "three";
import type { VerifyVisualState } from "../verify-machine.js";
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
// Focus tracks the graph center (`target`) with a WIDE world-space sharp band so the whole
// constellation stays crisp at any zoom — only the far void/starfield softens. (A shallow
// focal plane blurred the graph when zoomed out.) `bokehScale` kept small for a gentle falloff.
const DOF = { worldFocusRange: 34, bokehScale: 1.0 } as const;
/** Cinematic ambient-occlusion grade — cool-tinted crevice shading that seats bodies in the volume. */
const AO = { aoRadius: 1.6, intensity: 1.35, distanceFalloff: 1.0, halfRes: true } as const;

/**
 * Procedural image-based ambient (§U8.13 lighting rig) — a baked studio env built from `Lightformer`
 * area lights, NEVER a fetched HDRI (FR-E19: no external fetch, ever). `frames={1}` bakes the cubemap
 * once (static → cheap); `background={false}` keeps our void + starfield as the visible backdrop while
 * the env feeds real ambient + soft reflections into the emissive PBR bodies so they stop reading flat.
 * Cool focus-cyan key ↑right, warm human-gold rim ↙back, dim model-violet overhead fill, void floor.
 */
function CosmosEnvironment(): JSX.Element {
  return (
    <Environment frames={1} resolution={64} background={false} environmentIntensity={0.55}>
      <Lightformer
        form="rect"
        intensity={2.4}
        color={COSMOS.focus}
        scale={[12, 12, 1]}
        position={[9, 11, 9]}
        target={[0, 0, 0]}
      />
      <Lightformer
        form="rect"
        intensity={1.5}
        color={COSMOS.human}
        scale={[14, 7, 1]}
        position={[-11, -3, -13]}
        target={[0, 0, 0]}
      />
      <Lightformer
        form="ring"
        intensity={0.6}
        color={COSMOS.model}
        scale={[18, 18, 1]}
        position={[0, 15, -7]}
        target={[0, 0, 0]}
      />
      <Lightformer
        form="rect"
        intensity={0.12}
        color={COSMOS.void}
        scale={[34, 34, 1]}
        position={[0, -18, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      />
    </Environment>
  );
}

export function Cosmos3D({
  view,
  tier,
  plainMode = false,
  onDegrade,
  revealed,
  focusNodeId = null,
  waveOrder = [],
  verify,
  onPick,
}: {
  view: ExplorerView;
  tier: RenderTier;
  /** Plain mode (§U12): low-spectacle — no starfield / bloom / DOF grade, even on cinematic. */
  plainMode?: boolean;
  onDegrade?: () => void;
  /** Time-scrub reveal set; omitted = fully grown. */
  revealed?: ReadonlySet<string>;
  focusNodeId?: string | null;
  /** Deterministic verify light-wave order (`view.verifyWaveOrder`). */
  waveOrder?: ReadonlyArray<{ readonly from: string; readonly to: string }>;
  /** Verify-sequence visual state (light-wave / seal / byte-fracture). */
  verify?: VerifyVisualState;
  /** Pointer-pick a body → open its Inspector (carrying the screen point for origin-aware scale-in). */
  onPick?: (nodeId: string, origin: { readonly x: number; readonly y: number }) => void;
}): JSX.Element {
  // Plain mode drops the spectacle (starfield / postprocessing grade) but keeps the readable bodies +
  // threads — distinct from reduced motion, which stills the animation (§U12). State never changes.
  const cinematic = tier === "cinematic";
  const spectacle = cinematic && !plainMode;
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

      {/* Lighting — a cool key + a warm rim over baked image-based ambient (spectacle) for grounded,
          non-flat bodies. Ambient is kept low so the IBL + rig carry the contrast, not a flat wash. */}
      <ambientLight intensity={spectacle ? 0.22 : 0.35} color={COSMOS.inkMuted} />
      <directionalLight position={[18, 30, 26]} intensity={1.15} color={COSMOS.focus} />
      <pointLight position={[-10, -6, -18]} intensity={0.7} color={COSMOS.human} distance={140} />
      {spectacle ? <CosmosEnvironment /> : null}

      {plainMode ? null : <Starfield animate={cinematic} />}
      <Threads edges={visibleEdges} nodes={visibleNodes} waveOrder={waveOrder} verify={verify} />
      <Bodies nodes={visibleNodes} animate={spectacle} verify={verify} onPick={onPick} />

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
        autoRotate={spectacle}
        autoRotateSpeed={0.35}
      />
      <CameraRig focus={focusPos} fallback={[cx, cy, cz]} />

      {onDegrade ? <PerformanceMonitor onDecline={() => onDegrade()} /> : null}

      {spectacle ? (
        <EffectComposer>
          <N8AO
            aoRadius={AO.aoRadius}
            intensity={AO.intensity}
            distanceFalloff={AO.distanceFalloff}
            color={COSMOS.void}
            halfRes={AO.halfRes}
          />
          <Bloom
            intensity={BLOOM.intensity}
            luminanceThreshold={BLOOM.luminanceThreshold}
            luminanceSmoothing={BLOOM.luminanceSmoothing}
            mipmapBlur={BLOOM.mipmapBlur}
          />
          <DepthOfField
            target={[cx, cy, cz]}
            worldFocusRange={DOF.worldFocusRange}
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
