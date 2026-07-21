"use client";

import { Canvas } from "@react-three/fiber";

import { buildSyntheticCohortView } from "./synthetic-view";

const VIEW = buildSyntheticCohortView();

export default function CohortArenaClient() {
  const camera = VIEW.constellation.camera;

  return (
    <main className="arena-shell">
      <header className="arena-header">
        <div>
          <p className="arena-context">Synthetic operations view</p>
          <h1>Cohort Compiler Observatory</h1>
        </div>
        <p className="arena-summary">
          One deterministic cohort view supplies the spatial scene, operations summary, static tier,
          and accessible Ledger.
        </p>
      </header>

      <div className="arena-primary-grid">
        <section className="scene-panel" aria-labelledby="scene-heading" data-region="scene-3d">
          <div className="region-heading">
            <div>
              <p className="region-label">Compiler field</p>
              <h2 id="scene-heading">Two cohorts settled</h2>
            </div>
            <span className="status-chip">12 assigned</span>
          </div>
          <div className="canvas-shell" data-spectacle>
            <Canvas
              aria-hidden="true"
              camera={{
                position: [camera.position.x, camera.position.y, camera.position.z],
                fov: camera.fov,
                near: camera.near,
                far: camera.far,
              }}
              dpr={[1, 1.5]}
              frameloop="demand"
            >
              <color attach="background" args={[VIEW.presentation.palette.deck]} />
              <ambientLight intensity={0.35} />
            </Canvas>
          </div>
        </section>

        <aside className="hud-panel" aria-labelledby="hud-heading" data-region="hud">
          <div className="region-heading">
            <div>
              <p className="region-label">Operations summary</p>
              <h2 id="hud-heading">Compilation</h2>
            </div>
            <span className="status-dot" aria-label="All hard constraints satisfied" />
          </div>
          <div className="cohort-summary-list">
            {VIEW.cohorts.map((cohort) => (
              <section className="cohort-summary" key={cohort.cohortIndex}>
                <div>
                  <strong>Cohort {cohort.cohortIndex + 1}</strong>
                  <span>{cohort.members.length} members</span>
                </div>
                <p>
                  Non-harm floor {cohort.nonHarmFloor.minBenefit} ≥ {cohort.nonHarmFloor.floor}
                </p>
              </section>
            ))}
          </div>
        </aside>
      </div>

      <div className="arena-secondary-grid">
        <section className="tier-panel" aria-labelledby="tier-heading" data-region="tier-2d">
          <p className="region-label">Equal static tier</p>
          <h2 id="tier-heading">2D projection ready</h2>
          <p>
            The same {VIEW.constellation.hexes.length} cohort formations and{" "}
            {VIEW.cohorts.length * 6}
            learner positions are available without WebGL or motion.
          </p>
        </section>

        <section className="ledger-panel" aria-labelledby="ledger-heading" data-region="ledger">
          <div className="region-heading">
            <div>
              <p className="region-label">Accessible source of truth</p>
              <h2 id="ledger-heading">Cohort Ledger</h2>
            </div>
            <span className="ledger-count">{VIEW.ledger.cohortTree.length} cohorts</span>
          </div>
          <ol className="ledger-preview">
            {VIEW.ledger.cohortTree.map(({ label }) => (
              <li key={label}>{label}</li>
            ))}
          </ol>
        </section>
      </div>

      <p className="sr-only" aria-live="polite">
        {VIEW.ledger.announce}
      </p>
    </main>
  );
}
