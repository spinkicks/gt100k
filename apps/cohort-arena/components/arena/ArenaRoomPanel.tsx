"use client";

import type { CohortArenaView } from "@gt100k/cohort-arena-view";
import { Canvas } from "@react-three/fiber";

import { ArenaRoomScene } from "./ArenaRoomScene";
import { buildArenaRoomScene, resolveArenaFrameLoop, resolveArenaRoomMotion } from "./scene";

interface ArenaRoomPanelProps {
  readonly view: CohortArenaView;
  readonly reducedMotion: boolean;
}

export function ArenaRoomPanel({ view, reducedMotion }: ArenaRoomPanelProps) {
  const scene = buildArenaRoomScene(view);
  if (!scene) return null;

  const motion = resolveArenaRoomMotion(view);
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
            {scene.seats.map((seat) => (
              <g
                key={seat.speaker}
                data-arena-seat="true"
                data-speaker={seat.speaker}
                data-x={seat.pos2d.x}
                data-y={seat.pos2d.y}
                data-holding-floor={seat.holdingFloor}
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
            {floorHolder
              ? `${floorHolder.speaker} holds the floor — static highlight.`
              : "Aggregate session summary — no live floor-holder marker supplied."}
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
        </div>
      )}
    </section>
  );
}
