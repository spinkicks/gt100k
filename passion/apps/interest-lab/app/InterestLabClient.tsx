"use client";

import type { DeviceCaps, InterestLabView } from "@gt100k/interest-lab-view";
import { useReducedMotion } from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { QuestWorld } from "./child/QuestWorld";
import { GuideConsole } from "./guide/GuideConsole";
import type { GuideAuthoringInput } from "./guide/authoring";
import { SYNTHETIC_RETURN_HISTORY, buildSyntheticInterestLabSeed } from "./seed";
import { ChildComfortControls } from "./ui/controls/ChildComfortControls";
import { InterestLabControls } from "./ui/controls/InterestLabControls";
import {
  type InterestLabSurface as InterestLabSurfaceName,
  type MotionPreference,
  type RenderTierOverride,
  type SustainedPerformanceStep,
  applyRenderTierOverride,
  applySustainedPerformanceFloor,
  readInterestLabClientDefaults,
  resolveHydrationSafeReducedMotionPreference,
  resolveStaffDebugMode,
} from "./ui/controls/settings";
import { detectDeviceCaps } from "./ui/deviceCaps";
import { resolveMastheadCopy } from "./ui/mastheadCopy";

const DEFAULTS = readInterestLabClientDefaults({
  NEXT_PUBLIC_DEFAULT_AGE_BAND: process.env.NEXT_PUBLIC_DEFAULT_AGE_BAND,
  NEXT_PUBLIC_REDUCED_MOTION_DEFAULT: process.env.NEXT_PUBLIC_REDUCED_MOTION_DEFAULT,
  NEXT_PUBLIC_DEFAULT_SURFACE: process.env.NEXT_PUBLIC_DEFAULT_SURFACE,
  NEXT_PUBLIC_RENDER_TIER: process.env.NEXT_PUBLIC_RENDER_TIER,
});

const SERVER_DEVICE_CAPS: DeviceCaps = { webglAvailable: false };

export interface InterestLabSurfaceProps {
  view: InterestLabView;
  onContextLost?: () => void;
  onPerformanceDecline?: () => void;
  onAuthorRevision?: (input: GuideAuthoringInput) => void;
}

export function InterestLabSurface({
  view,
  onContextLost,
  onPerformanceDecline,
  onAuthorRevision,
}: InterestLabSurfaceProps) {
  return view.surface === "child" ? (
    <QuestWorld
      view={view}
      onContextLost={onContextLost}
      onPerformanceDecline={onPerformanceDecline}
    />
  ) : (
    <GuideConsole view={view} onAuthorRevision={onAuthorRevision} />
  );
}

export function InterestLabClient() {
  const osPrefersReducedMotion = useReducedMotion();
  const [ageBand, setAgeBand] = useState(DEFAULTS.ageBand);
  const [motionPreference, setMotionPreference] = useState<MotionPreference>(
    DEFAULTS.motionPreference,
  );
  const [plainMode, setPlainMode] = useState(false);
  const [surface, setSurface] = useState<InterestLabSurfaceName>(DEFAULTS.surface);
  const [renderTierOverride, setRenderTierOverride] = useState<RenderTierOverride>(
    DEFAULTS.renderTierOverride,
  );
  const [clientReady, setClientReady] = useState(false);
  const [staffDebug, setStaffDebug] = useState(false);
  const [deviceCaps, setDeviceCaps] = useState<DeviceCaps>(SERVER_DEVICE_CAPS);
  const [webglContextLost, setWebglContextLost] = useState(false);
  const [performanceStep, setPerformanceStep] = useState<SustainedPerformanceStep>(0);
  const [authoredReview, setAuthoredReview] = useState<GuideAuthoringInput | null>(null);

  useEffect(() => {
    setDeviceCaps(detectDeviceCaps());
    setStaffDebug(resolveStaffDebugMode(window.location.search));
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
          performanceStep,
        ),
        renderTierOverride,
      ),
    [deviceCaps, performanceStep, renderTierOverride, webglContextLost],
  );
  const seed = useMemo(
    () =>
      buildSyntheticInterestLabSeed({
        surface,
        ageBand,
        reducedMotion,
        plainMode,
        deviceCaps: effectiveDeviceCaps,
        history: SYNTHETIC_RETURN_HISTORY,
        ...(authoredReview ? { authoredReview } : {}),
      }),
    [surface, ageBand, reducedMotion, plainMode, effectiveDeviceCaps, authoredReview],
  );
  const activeRenderTier = seed.view.presentation.renderTier;
  const mastheadCopy = resolveMastheadCopy({
    surface,
    staffDebug,
    renderTier: activeRenderTier,
  });
  const handleContextLost = useCallback(() => setWebglContextLost(true), []);
  const handlePerformanceDecline = useCallback(
    () => setPerformanceStep((current) => (current === 0 ? 1 : 2)),
    [],
  );
  const handleAuthorRevision = useCallback(
    (review: GuideAuthoringInput) => setAuthoredReview(review),
    [],
  );

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
        data-staff-debug={staffDebug ? "true" : undefined}
      >
        <header className="masthead">
          <div className="title-group">
            <p className="context-line">{mastheadCopy.contextLine}</p>
            <h1>The Curiosity Atelier</h1>
            <p className="lede">Try different kinds of work and notice what draws you back.</p>
          </div>
          <p className="status-pill">
            <span aria-hidden="true" className="status-mark" />
            {mastheadCopy.statusLabel}
          </p>
        </header>

        {staffDebug ? (
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
        ) : surface === "child" ? (
          <ChildComfortControls
            ageBand={ageBand}
            calm={reducedMotion}
            onCalmChange={(calm) => setMotionPreference(calm ? "on" : "off")}
          />
        ) : null}

        <section className="quest-workspace material" id="interest-lab-content">
          <InterestLabSurface
            view={seed.view}
            onContextLost={handleContextLost}
            onPerformanceDecline={handlePerformanceDecline}
            onAuthorRevision={handleAuthorRevision}
          />
        </section>

        <footer>
          Synthetic data only · no live child records · choices never become fixed labels
        </footer>
      </main>
    </>
  );
}
