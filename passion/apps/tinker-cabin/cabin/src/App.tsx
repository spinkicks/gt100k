/**
 * App shell: the R3F Canvas (ACES tonemapping + bloom/vignette post), the camera rig (pinned for
 * the harness or free-look for play), the cabin scene, and the stats bridge. Reads deterministic
 * params from the URL so the harness can pin a pose and freeze animation.
 */
import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import { CameraRigHud } from "./Hud";
import { CameraRig } from "./controls/CameraRig";
import { StatsBridge } from "./core/StatsBridge";
import { parseParams } from "./core/params";
import { Cabin } from "./scene/Cabin";
import { ANCHORS } from "./scene/layout";

export function App(): JSX.Element {
  const params = parseParams();
  const [sx, sy, sz] = ANCHORS.spawn;

  return (
    <>
      <Canvas
        dpr={1}
        shadows
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.05,
        }}
        camera={{ position: [sx, sy, sz], fov: params.cam?.fov ?? 60, near: 0.05, far: 100 }}
      >
        <color attach="background" args={["#0a0b10"]} />
        <Cabin freeze={params.freeze} />
        <CameraRig params={params} />
        <StatsBridge />
        <EffectComposer>
          <Bloom mipmapBlur luminanceThreshold={0.85} luminanceSmoothing={0.12} intensity={0.5} />
          <Vignette eskil={false} offset={0.28} darkness={0.72} />
        </EffectComposer>
      </Canvas>
      {params.hud ? <CameraRigHud /> : null}
    </>
  );
}
