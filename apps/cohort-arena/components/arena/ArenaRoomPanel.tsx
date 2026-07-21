"use client";

import { type CohortArenaView, STATE_CUES } from "@gt100k/cohort-arena-view";
import { Canvas } from "@react-three/fiber";

import { ArenaRoomScene } from "./ArenaRoomScene";
import {
  buildArenaRoomScene,
  resolveArenaEvidenceMotion,
  resolveArenaFrameLoop,
  resolveArenaRoomMotion,
  resolveArenaSuppressionMotion,
} from "./scene";

interface ArenaRoomPanelProps {
  readonly view: CohortArenaView;
  readonly reducedMotion: boolean;
}

function SuppressionNotice({ overlay = false }: { readonly overlay?: boolean }) {
  return (
    <div
      className={
        overlay
          ? "arena-room-suppression-state arena-room-suppression-overlay"
          : "arena-room-suppression-state"
      }
      data-state-icon={STATE_CUES.suppressed.icon}
      aria-live="polite"
      aria-atomic="true"
    >
      <span className="arena-room-state-mark" aria-hidden="true">
        ▧
      </span>
      <div>
        <p className="arena-room-state-title">confidence low — prompts suppressed</p>
        <p className="arena-room-state-detail">No turn-taking pattern is being surfaced.</p>
      </div>
    </div>
  );
}

function AnalyticsOffState() {
  return (
    <div className="arena-room-off-state">
      <span className="arena-room-state-mark" data-state-icon="analytics-off" aria-hidden="true">
        ○
      </span>
      <div>
        <p className="arena-room-state-title">Analytics off</p>
        <p className="arena-room-state-detail">No turn-taking analytics were supplied.</p>
      </div>
    </div>
  );
}

export function ArenaRoomPanel({ view, reducedMotion }: ArenaRoomPanelProps) {
  const scene = buildArenaRoomScene(view);
  const analyticsOff = !scene || scene.seats.length === 0;

  if (analyticsOff) {
    return (
      <section
        className="scene-panel arena-room-panel"
        aria-labelledby="arena-room-heading"
        data-region="arena-room-off"
        data-rivalry-state="off"
      >
        <div className="region-heading">
          <div>
            <p className="region-label">Observable turn-taking</p>
            <h2 id="arena-room-heading">RivalryMix arena room</h2>
          </div>
          <span className="status-chip">Analytics off</span>
        </div>
        <AnalyticsOffState />
      </section>
    );
  }

  const motion = scene.suppressed
    ? resolveArenaSuppressionMotion(view)
    : resolveArenaRoomMotion(view);
  const evidenceMotion = resolveArenaEvidenceMotion(view);
  const floorHolder = scene.seats.find(({ holdingFloor }) => holdingFloor);
  const confidencePercent = Math.round(scene.confidence * 100);
  const world = view.constellation.world;

  return (
    <section
      className="scene-panel arena-room-panel"
      aria-labelledby="arena-room-heading"
      data-region={reducedMotion ? "arena-room-2d" : "arena-room-3d"}
      data-motion-kind={motion.kind}
      data-motion-mode={motion.mode}
      data-motion-duration={motion.durationMs}
      data-rivalry-confidence={scene.confidence}
      data-rivalry-suppressed={scene.suppressed}
      data-rivalry-state={scene.suppressed ? "suppressed" : "active"}
    >
      <div className="region-heading">
        <div>
          <p className="region-label">Observable turn-taking</p>
          <h2 id="arena-room-heading">RivalryMix arena room</h2>
        </div>
        <span className="status-chip">Confidence {confidencePercent}%</span>
      </div>

      {reducedMotion ? (
        <figure className="arena-room-static">
          <svg
            className="arena-room-map"
            viewBox={`0 0 ${world.width} ${world.height}`}
            aria-hidden="true"
            focusable="false"
          >
            <title>Static orthographic projection of observed turn-taking seats</title>
            <circle
              className="arena-room-ring"
              cx={world.width / 2}
              cy={world.height / 2}
              r="240"
            />
            {scene.dominanceRings.map((ring) => {
              const seat = scene.seats.find(({ speaker }) => speaker === ring.speaker);
              if (!seat) return null;

              return (
                <circle
                  key={ring.speaker}
                  data-dominance-ring="true"
                  data-speaker={ring.speaker}
                  data-share={ring.share}
                  data-motion-kind={evidenceMotion.dominanceRing.kind}
                  data-motion-duration={evidenceMotion.dominanceRing.durationMs}
                  className="arena-room-dominance-ring"
                  cx={seat.pos2d.x}
                  cy={seat.pos2d.y}
                  r="62"
                  pathLength="1"
                  strokeDasharray={`${ring.share} ${1 - ring.share}`}
                  transform={`rotate(-90 ${seat.pos2d.x} ${seat.pos2d.y})`}
                />
              );
            })}
            {scene.seats.map((seat) => (
              <g
                key={seat.speaker}
                data-arena-seat="true"
                data-speaker={seat.speaker}
                data-x={seat.pos2d.x}
                data-y={seat.pos2d.y}
                data-holding-floor={seat.holdingFloor}
                data-interruptions={seat.interruptions}
                transform={`translate(${seat.pos2d.x} ${seat.pos2d.y})`}
              >
                <circle
                  className={
                    seat.holdingFloor ? "arena-room-seat arena-room-seat-active" : "arena-room-seat"
                  }
                  r="46"
                />
                <text className="arena-room-seat-label" textAnchor="middle" y="7">
                  {seat.speaker}
                </text>
              </g>
            ))}
          </svg>
          <figcaption>
            {scene.suppressed ? (
              <SuppressionNotice />
            ) : floorHolder ? (
              `${floorHolder.speaker} holds the floor — static highlight.`
            ) : (
              "Aggregate session summary — no live floor-holder marker supplied."
            )}
          </figcaption>
        </figure>
      ) : (
        <div className="arena-room-canvas-shell" data-spectacle>
          <Canvas
            aria-hidden="true"
            camera={{ position: [0, 18, 25], fov: 42, near: 0.1, far: 100 }}
            dpr={[1, 1.5]}
            frameloop={resolveArenaFrameLoop(scene)}
            gl={{ antialias: true, powerPreference: "high-performance" }}
            shadows={false}
            onCreated={({ gl }) => gl.domElement.setAttribute("aria-hidden", "true")}
          >
            <color attach="background" args={[view.presentation.palette.deck]} />
            <ArenaRoomScene view={view} />
          </Canvas>
          {scene.suppressed ? <SuppressionNotice overlay /> : null}
        </div>
      )}
    </section>
  );
}
