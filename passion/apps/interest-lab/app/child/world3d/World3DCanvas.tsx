"use client";

import { CABIN, CAMERA3D, PALETTE, type SceneView } from "@gt100k/interest-lab-view";
import { AdaptiveDpr, ContactShadows } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { type ReactNode, useEffect, useMemo } from "react";
import { ACESFilmicToneMapping } from "three";
import { ProceduralEnvironment } from "./procedural-env";
import { WorldPostFX } from "./WorldPostFX";

// Grounding + rig constants for the "Curiosity Quest World" dusk atelier (see .loop/decisions.md D-VP1).
// The islands float above this notional sea; shadows land on it to anchor them.
const SEA_Y = -3.4;
const SEA_RADIUS = 46;
const RIM_LIGHT_POSITION: readonly [number, number, number] = [-8, 5, -7];
const RIM_LIGHT_INTENSITY = 0.58;
const ENVIRONMENT_INTENSITY = 0.5;

interface World3DRenderer {
  renderLists: { dispose: () => void };
  dispose: () => void;
  domElement?: {
    addEventListener: (type: string, listener: EventListener) => void;
    removeEventListener: (type: string, listener: EventListener) => void;
    setAttribute: (name: string, value: string) => void;
  };
}

export interface World3DRendererLifecycle {
  attach: (renderer: World3DRenderer, onContextLost?: () => void) => void;
  dispose: () => void;
}

export function createWorld3DRendererLifecycle(): World3DRendererLifecycle {
  let renderer: World3DRenderer | null = null;
  let detachContextLost: (() => void) | null = null;

  const disposeRenderer = () => {
    detachContextLost?.();
    detachContextLost = null;
    if (!renderer) return;
    const currentRenderer = renderer;
    renderer = null;
    currentRenderer.renderLists.dispose();
    currentRenderer.dispose();
  };

  return {
    attach(nextRenderer, onContextLost) {
      detachContextLost?.();
      renderer = nextRenderer;
      if (nextRenderer.domElement && onContextLost) {
        const listener: EventListener = (event) => {
          event.preventDefault();
          disposeRenderer();
          onContextLost();
        };
        nextRenderer.domElement.addEventListener("webglcontextlost", listener);
        detachContextLost = () =>
          nextRenderer.domElement?.removeEventListener("webglcontextlost", listener);
      }
    },
    dispose() {
      disposeRenderer();
    },
  };
}

export interface World3DCanvasProps {
  scene: SceneView;
  children?: ReactNode;
  onContextLost?: () => void;
}

export function World3DCanvas({ scene, children, onContextLost }: World3DCanvasProps) {
  const rendererLifecycle = useMemo(createWorld3DRendererLifecycle, []);

  useEffect(() => () => rendererLifecycle.dispose(), [rendererLifecycle]);

  return (
    <Canvas
      aria-hidden="true"
      camera={{
        position: scene.camera.pos,
        fov: CAMERA3D.fov,
        near: CAMERA3D.near,
        far: CAMERA3D.far,
      }}
      dpr={[1, scene.quality.dprCap]}
      gl={{ alpha: false, antialias: true, powerPreference: "high-performance" }}
      shadows={scene.quality.shadows}
      onCreated={({ gl, camera }) => {
        gl.domElement.setAttribute("aria-hidden", "true");
        rendererLifecycle.attach(gl, onContextLost);
        gl.toneMapping = ACESFilmicToneMapping;
        gl.toneMappingExposure = scene.scene3d.exposure;
        gl.setClearColor(scene.scene3d.bgHex);
        camera.lookAt(...scene.camera.target);
      }}
    >
      <color attach="background" args={[scene.scene3d.bgHex]} />
      <fog
        attach="fog"
        args={[scene.scene3d.fogHex, scene.scene3d.fogNear, scene.scene3d.fogFar]}
      />
      <ambientLight color={scene.scene3d.ambientHex} intensity={scene.scene3d.ambientIntensity} />
      <hemisphereLight
        color={scene.scene3d.hemiSkyHex}
        groundColor={scene.scene3d.hemiGroundHex}
        intensity={scene.scene3d.hemiIntensity}
      />
      <directionalLight
        castShadow={scene.quality.shadows}
        color={scene.scene3d.keyHex}
        intensity={scene.scene3d.keyIntensity}
        position={scene.scene3d.keyPos}
      />
      {/* Cool dusk-blue rim/back light — the Pillar B cool fill; separates the warm islands
          from the golden haze and traces their silhouettes, completing key + fill + rim. */}
      <directionalLight
        color={CABIN.duskSkylight}
        intensity={RIM_LIGHT_INTENSITY}
        position={RIM_LIGHT_POSITION}
      />
      {/* Local image-based ambient — a warm/cool equirect gradient baked ONCE via PMREM (cool dusk
          sky above → warm terracotta floor bounce below, warm peach + golden key bands at the
          horizon). This lifts the matte island materials into readable PBR and removes the flat,
          self-lit "gray primitive" look. Replaces the drei <Environment><Lightformer/> portal, whose
          cube-camera setup intermittently threw "Cannot read properties of undefined (reading '0')"
          → a BLANK canvas under frameloop="demand" (see procedural-env.tsx). No portal, no race. */}
      <ProceduralEnvironment
        cool={CABIN.duskSkylight}
        warm={PALETTE.sparkHi}
        floor={CABIN.terracotta}
        accentL={PALETTE.sparkHi}
        accentR={PALETTE.beacon}
        intensity={ENVIRONMENT_INTENSITY}
      />
      {/* Warm forest floor — a soft golden-hour ground the islands rest on; its far edge
          dissolves into the honey fog, giving the world a warm horizon instead of a black void
          (was the banned midnight #120b1e sea). Warm walnut, faint ember glow in the mist. */}
      <mesh receiveShadow={scene.quality.shadows} rotation={[-Math.PI / 2, 0, 0]} position={[0, SEA_Y, 0]}>
        <circleGeometry args={[SEA_RADIUS, 64]} />
        <meshStandardMaterial
          color={CABIN.woodWalnut}
          emissive={CABIN.terracotta}
          emissiveIntensity={0.1}
          metalness={0.1}
          roughness={0.95}
        />
      </mesh>
      {/* Soft contact shadows ground the floating islands on the warm floor. Full tier only,
          matching the existing shadow budget; tinted to the cool dusk-blue-violet so shadows
          read blue-violet, NEVER dead black (Pillar B / §13.2 shadow-color law). */}
      {scene.quality.shadows ? (
        <ContactShadows
          position={[0, SEA_Y + 0.02, 0]}
          scale={44}
          resolution={512}
          far={8}
          blur={2.8}
          opacity={0.55}
          color={CABIN.duskDeep}
        />
      ) : null}
      <AdaptiveDpr />
      {children}
      {/* Cinematic grade sits on top of the composed scene graph; full tier only (see WorldPostFX). */}
      <WorldPostFX scene3d={scene.scene3d} quality={scene.quality} />
    </Canvas>
  );
}
