"use client";

import type { DeviceCaps, RenderTier } from "@gt100k/interest-lab-view";
import { useReducedMotion } from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { QuestWorld } from "./child/QuestWorld";
import { buildSyntheticInterestLabSeed } from "./seed";
import { InterestLabControls } from "./ui/controls/InterestLabControls";
import {
  type InterestLabSurface,
  type MotionPreference,
  type RenderTierOverride,
  applyRenderTierOverride,
  applySustainedPerformanceFloor,
  readInterestLabClientDefaults,
  resolveHydrationSafeReducedMotionPreference,
} from "./ui/controls/settings";
import { detectDeviceCaps } from "./ui/deviceCaps";

const DEFAULTS = readInterestLabClientDefaults({
  NEXT_PUBLIC_DEFAULT_AGE_BAND: process.env.NEXT_PUBLIC_DEFAULT_AGE_BAND,
  NEXT_PUBLIC_REDUCED_MOTION_DEFAULT: process.env.NEXT_PUBLIC_REDUCED_MOTION_DEFAULT,
  NEXT_PUBLIC_DEFAULT_SURFACE: process.env.NEXT_PUBLIC_DEFAULT_SURFACE,
  NEXT_PUBLIC_RENDER_TIER: process.env.NEXT_PUBLIC_RENDER_TIER,
});

const SERVER_DEVICE_CAPS: DeviceCaps = { webglAvailable: false };

const TIER_STATUS: Record<RenderTier, string> = {
  "quest-world-3d": "Full 3D world",
  "quest-world-3d-lite": "Lighter 3D world",
  "board-2d": "Accessible 2D tier",
};

export function InterestLabClient() {
  const osPrefersReducedMotion = useReducedMotion();
  const [ageBand, setAgeBand] = useState(DEFAULTS.ageBand);
  const [motionPreference, setMotionPreference] = useState<MotionPreference>(
    DEFAULTS.motionPreference,
  );
  const [plainMode, setPlainMode] = useState(false);
  const [surface, setSurface] = useState<InterestLabSurface>(DEFAULTS.surface);
  const [renderTierOverride, setRenderTierOverride] = useState<RenderTierOverride>(
    DEFAULTS.renderTierOverride,
  );
  const [clientReady, setClientReady] = useState(false);
  const [deviceCaps, setDeviceCaps] = useState<DeviceCaps>(SERVER_DEVICE_CAPS);
  const [webglContextLost, setWebglContextLost] = useState(false);
  const [performanceDegraded, setPerformanceDegraded] = useState(false);

  useEffect(() => {
    setDeviceCaps(detectDeviceCaps());
    setClientReady(true);
  }, []);

  const reducedMotion = resolveHydrationSafeReducedMotionPreference(
    motionPreference,
    osPrefersReducedMotion === true,
    clientReady,
  );
  const effectiveDeviceCaps = useMemo(
    () =>
      applyRenderTierOverride(
        applySustainedPerformanceFloor(
          webglContextLost ? { ...deviceCaps, webglAvailable: false } : deviceCaps,
          performanceDegraded,
        ),
        renderTierOverride,
      ),
    [deviceCaps, performanceDegraded, renderTierOverride, webglContextLost],
  );
  const seed = useMemo(
    () =>
      buildSyntheticInterestLabSeed({
        ageBand,
        reducedMotion,
        plainMode,
        deviceCaps: effectiveDeviceCaps,
      }),
    [ageBand, reducedMotion, plainMode, effectiveDeviceCaps],
  );
  const activeRenderTier = seed.view.presentation.renderTier;
  const handleContextLost = useCallback(() => setWebglContextLost(true), []);
  const handlePerformanceDecline = useCallback(() => setPerformanceDegraded(true), []);

  return (
    <>
      <a className="skip-link" href="#interest-lab-content">
        Skip to Interest Lab
      </a>

      <main
        className={`shell interest-lab-client${plainMode ? " plain-mode" : ""}`}
        data-active-surface={surface}
        data-active-render-tier={activeRenderTier}
        data-requested-render-tier={renderTierOverride}
        data-webgl-context={webglContextLost ? "lost" : "available"}
      >
        <header className="masthead">
          <div className="title-group">
            <p className="context-line">Interest Lab · synthetic preview</p>
            <h1>The Curiosity Atelier</h1>
            <p className="lede">
              Try different kinds of work, notice what draws you back, and keep every possibility
              open.
            </p>
          </div>
          <p className="status-pill">
            <span aria-hidden="true" className="status-mark" />
            {TIER_STATUS[activeRenderTier]}
          </p>
        </header>

        <InterestLabControls
          ageBand={ageBand}
          motionPreference={motionPreference}
          plainMode={plainMode}
          surface={surface}
          renderTierOverride={renderTierOverride}
          effectiveReducedMotion={reducedMotion}
          activeRenderTier={activeRenderTier}
          onAgeBandChange={setAgeBand}
          onMotionPreferenceChange={setMotionPreference}
          onPlainModeChange={setPlainMode}
          onSurfaceChange={setSurface}
          onRenderTierOverrideChange={setRenderTierOverride}
        />

        <section className="quest-workspace material" id="interest-lab-content">
          {surface === "child" ? (
            <QuestWorld
              view={seed.view}
              onContextLost={handleContextLost}
              onPerformanceDecline={handlePerformanceDecline}
            />
          ) : (
            <section className="surface-placeholder" aria-live="polite">
              <p className="surface-name">Guide surface</p>
              <h2>The guide console is not active in this child MVP.</h2>
              <p>
                Switch back to Child quests to keep exploring. The guide surface will use the same
                synthetic Lab state when its evidence views arrive.
              </p>
            </section>
          )}
        </section>

        <footer>
          Synthetic data only · no live child records · choices never become fixed labels
        </footer>
      </main>
    </>
  );
}
