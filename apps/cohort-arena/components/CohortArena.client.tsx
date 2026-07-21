"use client";

import { Canvas } from "@react-three/fiber";
import { useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

import { CohortLedger } from "./ledger/CohortLedger";
import { ObservatoryScene } from "./observatory/ObservatoryScene";
import { buildSyntheticCohortView } from "./synthetic-view";
import { CohortTier2D } from "./tier2d/CohortTier2D";
import { resolveTier2DMode } from "./tier2d/mode";

const VIEW = buildSyntheticCohortView();

export default function CohortArenaClient() {
  const camera = VIEW.constellation.camera;
  const systemReducedMotion = useReducedMotion();
  const [plainMode, setPlainMode] = useState(VIEW.presentation.plain);
  const tier2D = resolveTier2DMode({
    configuredDefault: process.env.NEXT_PUBLIC_REDUCED_MOTION_DEFAULT,
    systemReducedMotion,
    plainMode,
  });

  useEffect(() => {
    const root = document.documentElement;
    const priorPlainMode = root.getAttribute("data-plain-mode");
    const priorReducedMotion = root.getAttribute("data-reduced-motion");

    if (plainMode) root.setAttribute("data-plain-mode", "true");
    else root.removeAttribute("data-plain-mode");

    if (tier2D.reason === "reduced-motion") root.setAttribute("data-reduced-motion", "true");
    else root.removeAttribute("data-reduced-motion");

    return () => {
      if (priorPlainMode === null) root.removeAttribute("data-plain-mode");
      else root.setAttribute("data-plain-mode", priorPlainMode);

      if (priorReducedMotion === null) root.removeAttribute("data-reduced-motion");
      else root.setAttribute("data-reduced-motion", priorReducedMotion);
    };
  }, [plainMode, tier2D.reason]);

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
        <div className="arena-view-controls" aria-label="View preferences">
          <button
            type="button"
            aria-pressed={plainMode}
            onClick={() => setPlainMode((current) => !current)}
          >
            Plain mode {plainMode ? "on" : "off"}
          </button>
        </div>
      </header>

      <div className="arena-primary-grid">
        {tier2D.active && tier2D.reason ? (
          <CohortTier2D view={VIEW} reason={tier2D.reason} />
        ) : (
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
                frameloop="always"
                gl={{ antialias: true, powerPreference: "high-performance" }}
                shadows={false}
              >
                <color attach="background" args={[VIEW.presentation.palette.deck]} />
                <ObservatoryScene view={VIEW} />
              </Canvas>
            </div>
          </section>
        )}

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

      <div className="arena-secondary-grid arena-ledger-grid">
        <section className="ledger-panel" aria-labelledby="ledger-heading" data-region="ledger">
          <div className="region-heading">
            <div>
              <p className="region-label">Accessible source of truth</p>
              <h2 id="ledger-heading">Cohort Ledger</h2>
            </div>
            <span className="ledger-count">{VIEW.ledger.cohortTree.length} cohorts</span>
          </div>
          <CohortLedger ledger={VIEW.ledger} />
        </section>
      </div>
    </main>
  );
}
