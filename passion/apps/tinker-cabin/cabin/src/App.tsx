/**
 * App shell: the R3F Canvas (ACES tonemapping + bloom/vignette post), the camera rig (pinned for
 * the harness or free-look for play), the cabin scene, the stats bridge, and the Discovery
 * interaction (walk to the desk, press E → the code "first taste" mini-app → behavioral signals).
 * Reads deterministic params from the URL so the harness can pin a pose and freeze animation.
 */
import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer, N8AO, Vignette } from "@react-three/postprocessing";
import { Physics } from "@react-three/rapier";
import { Suspense, useRef, useState } from "react";
import * as THREE from "three";
import { CameraRigHud } from "./Hud";
import { InteractionZone, PinnedCamera } from "./controls/CameraRig";
import { PhysicsController, RoomColliders } from "./controls/PhysicsController";
import { createIntent } from "./controls/intent";
import { StatsBridge } from "./core/StatsBridge";
import { parseParams } from "./core/params";
import { TasteApp } from "./interest/TasteApp";
import { exposeInterest } from "./interest/expose";
import type { InterestHypothesis } from "./interest/signals";
import { Cabin } from "./scene/Cabin";
import { ANCHORS } from "./scene/layout";

export function App(): JSX.Element {
  const params = parseParams();
  const intentRef = useRef(createIntent());
  const [tasteOpen, setTasteOpen] = useState(false);
  const [nearDesk, setNearDesk] = useState(false);
  const interactive = !params.cam; // the harness pins the camera and never interacts

  const onTasteResult = (h: InterestHypothesis): void => {
    setTasteOpen(false);
    exposeInterest(h);
    console.log(`[cabin] interest: ${h.state} — ${h.reasons.join("; ") || "weak signal"}`);
  };

  const [sx, sy, sz] = ANCHORS.spawn;

  return (
    <>
      <Canvas
        dpr={1}
        shadows="soft"
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 0.82,
        }}
        camera={{ position: [sx, sy, sz], fov: params.cam?.fov ?? 60, near: 0.05, far: 100 }}
      >
        <color attach="background" args={["#0a0b10"]} />
        <Cabin freeze={params.freeze} />
        {params.cam ? (
          // harness: pin the exact pose, no physics → deterministic screenshots
          <PinnedCamera pose={params.cam} />
        ) : (
          // free-walk: real physics character controller (collision + gravity)
          <Suspense fallback={null}>
            <Physics gravity={[0, -9.81, 0]} timeStep={1 / 60}>
              <RoomColliders />
              <PhysicsController intentRef={intentRef} />
            </Physics>
          </Suspense>
        )}
        {interactive && (
          <InteractionZone
            intentRef={intentRef}
            target={ANCHORS.desk}
            radius={1.7}
            onNear={setNearDesk}
            onInteract={() => setTasteOpen(true)}
          />
        )}
        <StatsBridge />
        <EffectComposer>
          {/* ambient occlusion → contact shadows in the crevices (grounds objects; subtle on
              software-GL headless shots, stronger on a real GPU) */}
          <N8AO aoRadius={0.5} intensity={2.2} distanceFalloff={1} halfRes />
          <Bloom mipmapBlur luminanceThreshold={0.85} luminanceSmoothing={0.12} intensity={0.5} />
          <Vignette eskil={false} offset={0.28} darkness={0.72} />
        </EffectComposer>
      </Canvas>
      {params.hud ? <CameraRigHud /> : null}
      {interactive && nearDesk && !tasteOpen ? <Prompt /> : null}
      {tasteOpen ? <TasteApp onClose={onTasteResult} /> : null}
    </>
  );
}

function Prompt(): JSX.Element {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 28,
        left: "50%",
        transform: "translateX(-50%)",
        padding: "8px 14px",
        borderRadius: 10,
        background: "rgba(10,12,16,0.7)",
        color: "#f0e6d6",
        font: "600 14px ui-sans-serif, system-ui, sans-serif",
        border: "1px solid rgba(255,180,110,0.35)",
        pointerEvents: "none",
      }}
    >
      Press <b>E</b> to try the coding station
    </div>
  );
}
