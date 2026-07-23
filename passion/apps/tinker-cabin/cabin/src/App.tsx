/**
 * App shell: the R3F Canvas (ACES tonemapping + bloom/vignette post), the camera rig (pinned for
 * the harness or free-look for play), the cabin scene, the stats bridge, and the Discovery
 * interaction (walk to the desk, press E → the code "first taste" mini-app → behavioral signals).
 * Reads deterministic params from the URL so the harness can pin a pose and freeze animation.
 */
import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer, N8AO, Vignette } from "@react-three/postprocessing";
import { Physics } from "@react-three/rapier";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { CameraRigHud } from "./Hud";
import { PinnedCamera } from "./controls/CameraRig";
import { GadgetZones } from "./controls/GadgetZones";
import { PhysicsController, RoomColliders } from "./controls/PhysicsController";
import { createIntent } from "./controls/intent";
import { StatsBridge } from "./core/StatsBridge";
import { parseParams } from "./core/params";
import { CodeChallenge } from "./interest/CodeChallenge";
import { TasteApp } from "./interest/TasteApp";
import { CHALLENGES, type CodeLine } from "./interest/challenges";
import { exposeInterest } from "./interest/expose";
import { GadgetSignalRecorder, exposeGadgets } from "./interest/gadgetSignals";
import type { InterestHypothesis } from "./interest/signals";
import { Cabin } from "./scene/Cabin";
import { GADGETS, activateGadget, createGadgetStore, gadgetDef } from "./scene/gadgets/gadgetState";
import { ANCHORS } from "./scene/layout";

export function App(): JSX.Element {
  const params = parseParams();
  const intentRef = useRef(createIntent());
  const [tasteOpen, setTasteOpen] = useState(false);
  // ?challenge=<id> opens that gadget's overlay on load (debug/test/screenshots); else null.
  const [challengeId, setChallengeId] = useState<string | null>(params.challenge);
  const [nearId, setNearId] = useState<string | null>(null);
  const [discovered, setDiscovered] = useState(0);
  // edited programs per gadget, so re-opening a challenge (e.g. after the lamp playback exits the
  // menu) restores your edits instead of resetting to the broken starter program.
  const [programs, setPrograms] = useState<Record<string, CodeLine[]>>({});
  const interactive = !params.cam; // the harness pins the camera and never interacts

  // shared, mutable gadget visual state — the interaction manager mutates it and the scene meshes
  // read it each frame (same ref-store pattern as intentRef). Seeded from ?act= for showcase shots.
  const store = useMemo(() => createGadgetStore(params.act), [params.act]);
  const recorder = useMemo(() => new GadgetSignalRecorder(), []);

  const onTasteResult = (h: InterestHypothesis): void => {
    setTasteOpen(false);
    exposeInterest(h);
    console.log(`[cabin] interest: ${h.state} — ${h.reasons.join("; ") || "weak signal"}`);
  };

  /** Record a breadth discovery for a gadget (its family + that it was reached). */
  const recordDiscovery = (id: string, mode: number, firstTime: boolean): void => {
    const def = gadgetDef(id);
    if (!def) return;
    const summary = recorder.record({
      gadgetId: id,
      domain: def.domain,
      mode,
      firstTime,
      at: Date.now(),
    });
    exposeGadgets(summary);
    setDiscovered(summary.discovered.length);
    console.log(
      `[cabin] discovered ${id} (${def.domain}) → mode ${mode}; ${summary.reasons.join("; ")}`,
    );
  };

  const onActivate = (id: string): void => {
    const def = gadgetDef(id);
    if (!def) return;
    if (id === "code-station") {
      setTasteOpen(true);
      return;
    }
    // Code-driven gadgets: pressing E opens the gadget's code challenge (the coding-shack game).
    // Running the code drives the real 3D gadget live; solving it locks it "online".
    if (CHALLENGES[id]) {
      setChallengeId(id);
      return;
    }
    // Fallback (gadgets not yet converted to a code challenge): plain toggle discovery.
    const { mode, firstTime } = activateGadget(store, id);
    recordDiscovery(id, mode, firstTime);
  };

  const onChallengeClose = (h: InterestHypothesis): void => {
    setChallengeId(null);
    exposeInterest(h);
    console.log(`[cabin] coding session: ${h.state} — ${h.reasons.join("; ") || "weak signal"}`);
  };

  const nearLabel = nearId ? (gadgetDef(nearId)?.label ?? null) : null;
  const openSpec = challengeId ? CHALLENGES[challengeId] : undefined;
  const overlayOpen = tasteOpen || Boolean(openSpec);
  const [sx, sy, sz] = ANCHORS.spawn;

  // When a code overlay opens, release pointer lock so the cursor is immediately usable on the panel
  // (no manual Esc). Re-locking on the next canvas click is handled + rejection-guarded in intent.ts.
  useEffect(() => {
    if (overlayOpen && typeof document !== "undefined" && document.pointerLockElement) {
      document.exitPointerLock();
    }
  }, [overlayOpen]);

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
        {/* subtle aerial-perspective fog tinted to the sky — distant trees/mountains fade into it
            (real depth); density is low so the small interior is barely affected. */}
        <fogExp2 attach="fog" args={["#9aadc9", 0.009]} />
        <Cabin freeze={params.freeze} gadgets={store} />
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
          <GadgetZones
            intentRef={intentRef}
            gadgets={GADGETS}
            onNear={setNearId}
            onActivate={onActivate}
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
      {interactive ? <DiscoveryCounter n={discovered} total={GADGETS.length - 1} /> : null}
      {interactive && !overlayOpen ? <Crosshair active={Boolean(nearLabel)} /> : null}
      {interactive && nearLabel && !overlayOpen ? <Prompt label={nearLabel} /> : null}
      {tasteOpen ? <TasteApp onClose={onTasteResult} /> : null}
      {openSpec ? (
        <CodeChallenge
          spec={openSpec}
          initialLines={programs[openSpec.gadgetId]}
          onProgramChange={(lines) => setPrograms((p) => ({ ...p, [openSpec.gadgetId]: lines }))}
          onWorld={(mode) => {
            const st = store[openSpec.gadgetId];
            if (st) st.mode = mode;
          }}
          onPlayback={(trace, solved) => {
            const st = store[openSpec.gadgetId];
            if (!st) return;
            st.seq = trace;
            st.seqId = (st.seqId ?? 0) + 1; // latch a fresh playback in the gadget
            st.solved = solved;
          }}
          onSolvedDiscovery={() => {
            const st = store[openSpec.gadgetId];
            if (!st) return;
            // keep the mode the Run just set (worldMode drove the live motion, e.g. the gizmo's
            // spin speed) — don't clobber it with the static showcase mode.
            const firstTime = !st.discovered;
            st.discovered = true;
            recordDiscovery(openSpec.gadgetId, st.mode, firstTime);
          }}
          onClose={onChallengeClose}
        />
      ) : null}
    </>
  );
}

function Prompt({ label }: { label: string }): JSX.Element {
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
      Press <b>E</b> — {label}
    </div>
  );
}

/** Minecraft-style centre crosshair. Turns amber + grows a ring when aimed at an interactable, so the
 *  player knows a click / E will do something there. Hidden in overlays + harness shots. */
function Crosshair({ active }: { active: boolean }): JSX.Element {
  const col = active ? "rgba(255,196,110,0.95)" : "rgba(255,255,255,0.75)";
  const bar: React.CSSProperties = {
    position: "absolute",
    background: col,
    boxShadow: "0 0 2px rgba(0,0,0,0.9)",
    borderRadius: 1,
  };
  const len = active ? 12 : 10;
  const th = 2;
  return (
    <div
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%,-50%)",
        width: 30,
        height: 30,
        pointerEvents: "none",
        zIndex: 15,
      }}
    >
      {/* horizontal + vertical bars forming a + */}
      <div
        style={{
          ...bar,
          top: "50%",
          left: "50%",
          width: len,
          height: th,
          transform: "translate(-50%,-50%)",
        }}
      />
      <div
        style={{
          ...bar,
          top: "50%",
          left: "50%",
          width: th,
          height: len,
          transform: "translate(-50%,-50%)",
        }}
      />
      {/* highlight ring when aimed at an interactable */}
      {active ? (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: 26,
            height: 26,
            transform: "translate(-50%,-50%)",
            border: "2px solid rgba(255,196,110,0.9)",
            borderRadius: "50%",
            boxShadow: "0 0 4px rgba(0,0,0,0.7)",
          }}
        />
      ) : null}
    </div>
  );
}

/** Small corner readout of how many gadgets the player has discovered (never shown in harness shots). */
function DiscoveryCounter({ n, total }: { n: number; total: number }): JSX.Element {
  return (
    <div
      style={{
        position: "fixed",
        top: 12,
        right: 14,
        padding: "6px 12px",
        borderRadius: 9,
        background: "rgba(10,12,16,0.62)",
        color: "#f0e6d6",
        font: "600 13px ui-sans-serif, system-ui, sans-serif",
        border: "1px solid rgba(255,180,110,0.28)",
        pointerEvents: "none",
      }}
    >
      Discovered {n}/{total}
    </div>
  );
}
