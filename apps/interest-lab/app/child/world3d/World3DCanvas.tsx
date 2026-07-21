"use client";

import { CAMERA3D, type SceneView } from "@gt100k/interest-lab-view";
import { AdaptiveDpr } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { type ReactNode, useEffect, useMemo } from "react";
import { ACESFilmicToneMapping } from "three";

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
      <AdaptiveDpr />
      {children}
    </Canvas>
  );
}
