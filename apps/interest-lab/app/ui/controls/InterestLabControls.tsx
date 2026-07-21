"use client";

import { type AgeBand, type RenderTier, resolveChildStaging } from "@gt100k/interest-lab-view";
import type { CSSProperties } from "react";
import type { InterestLabSurface, MotionPreference, RenderTierOverride } from "./settings";

export interface InterestLabControlsProps {
  ageBand: AgeBand;
  motionPreference: MotionPreference;
  plainMode: boolean;
  surface: InterestLabSurface;
  renderTierOverride: RenderTierOverride;
  effectiveReducedMotion: boolean;
  activeRenderTier: RenderTier;
  onAgeBandChange: (value: AgeBand) => void;
  onMotionPreferenceChange: (value: MotionPreference) => void;
  onPlainModeChange: (value: boolean) => void;
  onSurfaceChange: (value: InterestLabSurface) => void;
  onRenderTierOverrideChange: (value: RenderTierOverride) => void;
}

const tierName: Record<RenderTier, string> = {
  "quest-world-3d": "full 3D world",
  "quest-world-3d-lite": "lighter 3D world",
  "board-2d": "accessible 2D board",
};

export function InterestLabControls(props: InterestLabControlsProps) {
  const style = {
    "--control-target": `${resolveChildStaging(props.ageBand).touchTargetPx}px`,
  } as CSSProperties;
  const pendingTier =
    props.renderTierOverride !== "auto" && props.renderTierOverride !== props.activeRenderTier;
  const tierStatus = pendingTier
    ? `${tierName[props.renderTierOverride as RenderTier]} requested. Showing the ${tierName[props.activeRenderTier]} in this preview.`
    : `Showing the ${tierName[props.activeRenderTier]}.`;

  return (
    <section className="control-panel material" style={style} aria-labelledby="controls-title">
      <div className="control-heading">
        <div>
          <p className="surface-name">Presentation only</p>
          <h2 id="controls-title">Interest Lab controls</h2>
        </div>
        <output aria-live="polite">
          {tierStatus} Motion is {props.effectiveReducedMotion ? "reduced" : "animated"}.
        </output>
      </div>

      <div className="control-grid">
        <label className="control-field">
          <span>Age band</span>
          <select
            name="age-band"
            value={props.ageBand}
            onChange={(event) => props.onAgeBandChange(event.target.value as AgeBand)}
          >
            <option value="6-8">Ages 6–8</option>
            <option value="9-11">Ages 9–11</option>
            <option value="12-14">Ages 12–14</option>
          </select>
        </label>

        <label className="control-field">
          <span>Motion</span>
          <select
            name="motion-preference"
            value={props.motionPreference}
            onChange={(event) =>
              props.onMotionPreferenceChange(event.target.value as MotionPreference)
            }
          >
            <option value="system">Match this device</option>
            <option value="on">Reduce motion</option>
            <option value="off">Use animation</option>
          </select>
        </label>

        <label className="control-field">
          <span>Surface</span>
          <select
            name="surface"
            value={props.surface}
            onChange={(event) => props.onSurfaceChange(event.target.value as InterestLabSurface)}
          >
            <option value="child">Child quests</option>
            <option value="guide">Guide console</option>
          </select>
        </label>

        <label className="control-field">
          <span>Render tier</span>
          <select
            name="render-tier"
            value={props.renderTierOverride}
            onChange={(event) =>
              props.onRenderTierOverrideChange(event.target.value as RenderTierOverride)
            }
          >
            <option value="auto">Automatic</option>
            <option value="quest-world-3d">Full 3D world</option>
            <option value="quest-world-3d-lite">Lighter 3D world</option>
            <option value="board-2d">2D board</option>
          </select>
        </label>

        <label className="control-check">
          <input
            type="checkbox"
            name="plain-mode"
            checked={props.plainMode}
            onChange={(event) => props.onPlainModeChange(event.target.checked)}
          />
          <span>Plain mode</span>
        </label>
      </div>
    </section>
  );
}
