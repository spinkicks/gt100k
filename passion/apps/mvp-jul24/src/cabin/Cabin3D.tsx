import { PerspectiveCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import * as THREE from "three";
import type { TopicId } from "../game/types";
import { Cabin } from "./scene3d/Cabin";
import { EnvLight } from "./scene3d/EnvLight";

/**
 * 3D cabin backend: a fixed-camera, real-asset cozy room (warm scanned wood, HDR image-based
 * lighting, a glowing stone fireplace, a window onto a mountain vista, a cat, a wall lantern) with
 * clickable 3D props — not floating UI markers — for each gadget (see scene3d/GadgetProps.tsx).
 * The camera is static — no OrbitControls/PointerLock/WASD/physics; the view never moves.
 */
export const Cabin3D: React.FC<{ topic: TopicId }> = ({ topic }) => {
  return (
    <div className="cabin3d-canvas-wrap" style={{ width: "100%", height: "100%" }}>
      <Canvas shadows dpr={[1, 2]} gl={{ toneMappingExposure: 1.05 }}>
        <color attach="background" args={["#171310"]} />
        <PerspectiveCamera
          makeDefault
          position={[-1.35, 1.55, 2.75]}
          fov={62}
          onUpdate={(self) => self.lookAt(new THREE.Vector3(0.55, 1.25, -2.7))}
        />
        <Suspense fallback={null}>
          <EnvLight />
          <Cabin topic={topic} />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default Cabin3D;
