"use client";

import { resolveMotion } from "@gt100k/cohort-arena-view";
import { Canvas } from "@react-three/fiber";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useState } from "react";

import { RollbackControl } from "./RollbackControl";
import { StandingsToggle } from "./StandingsToggle";
import { ArenaRoomPanel } from "./arena/ArenaRoomPanel";
import { ChurnBudgetMeter } from "./hud/ChurnBudgetMeter";
import { CohortRosterHud } from "./hud/CohortRosterHud";
import { StandingsPanel } from "./hud/StandingsPanel";
import { toMotionEasing } from "./hud/motion-transition";
import { CohortLedger } from "./ledger/CohortLedger";
import { ObservatoryScene } from "./observatory/ObservatoryScene";
import {
  SYNTHETIC_CHURN_BUDGET,
  SYNTHETIC_ROLLBACK_ASSIGNMENTS,
  buildSyntheticRollbackViews,
} from "./synthetic-view";
import { CohortTier2D } from "./tier2d/CohortTier2D";
import { resolveTier2DMode } from "./tier2d/mode";

export default function CohortArenaClient() {
  const systemReducedMotion = useReducedMotion();
  const [plainMode, setPlainMode] = useState(false);
  const [rolledBack, setRolledBack] = useState(false);
  const [hasSnapshotTransition, setHasSnapshotTransition] = useState(false);
  const [standingsOptIn, setStandingsOptIn] = useState(false);
  const tier2D = resolveTier2DMode({
    configuredDefault: process.env.NEXT_PUBLIC_REDUCED_MOTION_DEFAULT,
    systemReducedMotion,
    plainMode,
  });
  const snapshotViews = useMemo(
    () =>
      buildSyntheticRollbackViews({
        plain: plainMode,
        reducedMotion: tier2D.active,
        standingsOptIn,
      }),
    [plainMode, standingsOptIn, tier2D.active],
  );
  const view = rolledBack ? snapshotViews.prior : snapshotViews.current;
  const camera = view.constellation.camera;
  const press = resolveMotion("press", { reducedMotion: tier2D.active });

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
          <motion.button
            type="button"
            aria-pressed={plainMode}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: press.durationMs / 1_000, ease: toMotionEasing(press.easing) }}
            onClick={() => setPlainMode((current) => !current)}
          >
            Plain mode {plainMode ? "on" : "off"}
          </motion.button>
          <StandingsToggle
            optedIn={standingsOptIn}
            reducedMotion={tier2D.active}
            onToggle={() => setStandingsOptIn((current) => !current)}
          />
        </div>
      </header>

      <div className="arena-primary-grid">
        {tier2D.active && tier2D.reason ? (
          <CohortTier2D view={view} reason={tier2D.reason} />
        ) : (
          <section className="scene-panel" aria-labelledby="scene-heading" data-region="scene-3d">
            <div className="region-heading">
              <div>
                <p className="region-label">Compiler field</p>
                <h2 id="scene-heading">
                  {rolledBack ? "Prior snapshot settled" : "Current snapshot settled"}
                </h2>
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
                onCreated={({ gl }) => gl.domElement.setAttribute("aria-hidden", "true")}
              >
                <color attach="background" args={[view.presentation.palette.deck]} />
                <ObservatoryScene
                  view={view}
                  transitionKind={hasSnapshotTransition ? "rollback" : "compile"}
                />
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
          <CohortRosterHud view={view} reducedMotion={tier2D.active} />
          <ChurnBudgetMeter budget={SYNTHETIC_CHURN_BUDGET} cohorts={view.cohorts} />
          <RollbackControl
            currentAssignmentId={SYNTHETIC_ROLLBACK_ASSIGNMENTS.current.id}
            priorAssignmentId={SYNTHETIC_ROLLBACK_ASSIGNMENTS.prior.id}
            reducedMotion={tier2D.active}
            rolledBack={rolledBack}
            onToggle={() => {
              setHasSnapshotTransition(true);
              setRolledBack((current) => !current);
            }}
          />
          <StandingsPanel standings={view.standings} reducedMotion={tier2D.active} />
        </aside>
      </div>

      <div className="arena-secondary-grid">
        <ArenaRoomPanel view={view} reducedMotion={tier2D.active} />
        <section className="ledger-panel" aria-labelledby="ledger-heading" data-region="ledger">
          <div className="region-heading">
            <div>
              <p className="region-label">Accessible source of truth</p>
              <h2 id="ledger-heading">Cohort Ledger</h2>
            </div>
            <span className="ledger-count">{view.ledger.cohortTree.length} cohorts</span>
          </div>
          <CohortLedger ledger={view.ledger} />
        </section>
      </div>
    </main>
  );
}
