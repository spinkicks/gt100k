"use client";

import type { DeviceCaps } from "@gt100k/interest-lab-view";
import { useReducedMotion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { QuestLedger } from "./child/QuestLedger";
import { buildSyntheticInterestLabSeed } from "./seed";
import { InterestLabControls } from "./ui/controls/InterestLabControls";
import {
  type InterestLabSurface,
  type MotionPreference,
  type RenderTierOverride,
  readInterestLabClientDefaults,
  resolveReducedMotionPreference,
} from "./ui/controls/settings";
import { detectDeviceCaps } from "./ui/deviceCaps";

const DEFAULTS = readInterestLabClientDefaults({
  NEXT_PUBLIC_DEFAULT_AGE_BAND: process.env.NEXT_PUBLIC_DEFAULT_AGE_BAND,
  NEXT_PUBLIC_REDUCED_MOTION_DEFAULT: process.env.NEXT_PUBLIC_REDUCED_MOTION_DEFAULT,
  NEXT_PUBLIC_DEFAULT_SURFACE: process.env.NEXT_PUBLIC_DEFAULT_SURFACE,
  NEXT_PUBLIC_RENDER_TIER: process.env.NEXT_PUBLIC_RENDER_TIER,
});

const SERVER_DEVICE_CAPS: DeviceCaps = { webglAvailable: false };

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
  const [deviceCaps, setDeviceCaps] = useState<DeviceCaps>(SERVER_DEVICE_CAPS);

  useEffect(() => setDeviceCaps(detectDeviceCaps()), []);

  const reducedMotion = resolveReducedMotionPreference(
    motionPreference,
    osPrefersReducedMotion === true,
  );
  const seed = useMemo(
    () => buildSyntheticInterestLabSeed({ ageBand, reducedMotion, plainMode, deviceCaps }),
    [ageBand, reducedMotion, plainMode, deviceCaps],
  );
  const activeRenderTier = seed.view.presentation.renderTier;

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
            Accessible 2D tier
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
            <QuestLedger picker={seed.view.probePicker} />
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
