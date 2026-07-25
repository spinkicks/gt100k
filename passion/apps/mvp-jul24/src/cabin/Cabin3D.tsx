import { PerspectiveCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import * as THREE from "three";
import type { TopicId } from "../game/types";
import { Cabin } from "./scene3d/Cabin";
import { EnvLight } from "./scene3d/EnvLight";

/** Warm placeholder lighting for the (currently never-hit, but defensive) Suspense fallback below:
 *  Cabin's own ambient/directional/fireplace lights are all synchronous already, so the room is lit
 *  from frame one — but if a future change makes the subtree actually suspend, this keeps that gap
 *  a warm ember glow instead of a flat black/blank canvas. */
function WarmFallbackLight(): JSX.Element {
  return (
    <>
      <ambientLight color="#3a2a1c" intensity={0.5} />
      <pointLight position={[0, 0.8, -2.65]} color="#ff8a3c" intensity={8} distance={9} decay={2} />
    </>
  );
}

/**
 * 3D cabin backend: a fixed-camera, real-asset cozy room (warm scanned wood, HDR image-based
 * lighting, a glowing stone fireplace, a window onto a mountain vista, a cat, a wall lantern) with
 * clickable 3D props — not floating UI markers — for each gadget (see scene3d/GadgetProps.tsx).
 * The camera is static — no OrbitControls/PointerLock/WASD/physics; the view never moves.
 */
export const Cabin3D: React.FC<{ topic: TopicId }> = ({ topic }) => {
  return (
    <div className="cabin3d-canvas-wrap" style={{ width: "100%", height: "100%" }}>
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
      >
        <color attach="background" args={["#171310"]} />
        {/* A touch of warm atmosphere — thick enough to soften the far back wall, subtle enough
            that nothing this close to camera (rug, cat, fireplace) reads as hazy. */}
        <fogExp2 attach="fog" color="#231407" density={0.05} />
        <PerspectiveCamera
          makeDefault
          position={[-1.35, 1.55, 2.75]}
          fov={62}
          onUpdate={(self) => self.lookAt(new THREE.Vector3(0.55, 1.25, -2.7))}
        />
        <Suspense fallback={<WarmFallbackLight />}>
          <EnvLight />
          <Cabin topic={topic} />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default Cabin3D;
