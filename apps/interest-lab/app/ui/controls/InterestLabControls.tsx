"use client";

import { type AgeBand, type RenderTier, resolveChildStaging } from "@gt100k/interest-lab-view";
import type { CSSProperties, ReactNode, SVGProps } from "react";
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

/** Lucide-weight inline glyphs, matching the app-wide 24×24/1.8 stroke language. */
function DeckIcon({ name, ...props }: { name: DeckIconName } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {DECK_GLYPHS[name]}
    </svg>
  );
}

type DeckIconName = "age" | "motion" | "surface" | "tier" | "plain" | "settings" | "chevron";

const DECK_GLYPHS: Record<DeckIconName, ReactNode> = {
  age: (
    <>
      <path d="M6 20V13M12 20V8M18 20V4" />
      <path d="M4 20h16" />
    </>
  ),
  motion: (
    <>
      <path d="M2 12h3l2.5 6 5-14 2.5 8 2-4H22" />
    </>
  ),
  surface: (
    <>
      <path d="m12 3 8 4.5-8 4.5-8-4.5Z" />
      <path d="m4 12 8 4.5 8-4.5" />
    </>
  ),
  tier: (
    <>
      <path d="M12 3 20 7.5v9L12 21l-8-4.5v-9Z" />
      <path d="M12 12v9M12 12 4 7.5M12 12l8-4.5" />
    </>
  ),
  plain: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v18" />
      <path d="M12 3a9 9 0 0 1 0 18Z" fill="currentColor" stroke="none" />
    </>
  ),
  settings: (
    <>
      <path d="M4 6h9M17 6h3" />
      <circle cx="15" cy="6" r="2" />
      <path d="M4 12h3M11 12h9" />
      <circle cx="9" cy="12" r="2" />
      <path d="M4 18h11M19 18h1" />
      <circle cx="17" cy="18" r="2" />
    </>
  ),
  chevron: <path d="m6 9 6 6 6-6" />,
};

interface SegmentOption<Value extends string> {
  value: Value;
  label: string;
  hint?: string;
}

interface SegmentedControlProps<Value extends string> {
  name: string;
  title: string;
  icon: DeckIconName;
  value: Value;
  options: readonly SegmentOption<Value>[];
  onChange: (value: Value) => void;
}

function SegmentedControl<Value extends string>({
  name,
  title,
  icon,
  value,
  options,
  onChange,
}: SegmentedControlProps<Value>) {
  return (
    <fieldset className="hud-field">
      <legend className="hud-field-title">
        <DeckIcon name={icon} />
        <span>{title}</span>
      </legend>
      <div className="hud-track">
        {options.map((option) => (
          <label
            key={option.value}
            className="hud-seg"
            data-checked={option.value === value ? "true" : undefined}
          >
            <input
              className="hud-seg-input"
              type="radio"
              name={name}
              value={option.value}
              checked={option.value === value}
              onChange={() => onChange(option.value)}
            />
            <span className="hud-seg-body">
              <span className="hud-seg-label">{option.label}</span>
              {option.hint ? <span className="hud-seg-hint">{option.hint}</span> : null}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

const AGE_OPTIONS: readonly SegmentOption<AgeBand>[] = [
  { value: "6-8", label: "6–8" },
  { value: "9-11", label: "9–11" },
  { value: "12-14", label: "12–14" },
];

const MOTION_OPTIONS: readonly SegmentOption<MotionPreference>[] = [
  { value: "system", label: "Auto" },
  { value: "off", label: "Full" },
  { value: "on", label: "Calm" },
];

const SURFACE_OPTIONS: readonly SegmentOption<InterestLabSurface>[] = [
  { value: "child", label: "Quests" },
  { value: "guide", label: "Guide" },
];

const TIER_OPTIONS: readonly SegmentOption<RenderTierOverride>[] = [
  { value: "auto", label: "Auto" },
  { value: "quest-world-3d", label: "Full 3D" },
  { value: "quest-world-3d-lite", label: "Lite 3D" },
  { value: "board-2d", label: "2D" },
];

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
    <section className="control-panel hud-deck material" style={style} aria-labelledby="controls-title">
      <div className="hud-header">
        <div className="hud-titles">
          <p className="hud-eyebrow">
            <span className="hud-eyebrow-dot" aria-hidden="true" />
            Mission deck
          </p>
          <h2 id="controls-title">Interest Lab controls</h2>
        </div>
        <output className="hud-status" data-pending={pendingTier ? "true" : undefined} aria-live="polite">
          <span className="hud-status-mark" aria-hidden="true" />
          <span>
            {tierStatus} Motion is {props.effectiveReducedMotion ? "reduced" : "animated"}.
          </span>
        </output>
      </div>

      <div className="hud-primary">
        <SegmentedControl
          name="surface"
          title="Viewing"
          icon="surface"
          value={props.surface}
          options={SURFACE_OPTIONS}
          onChange={props.onSurfaceChange}
        />
      </div>

      <details className="hud-advanced">
        <summary className="hud-advanced-summary">
          <span className="hud-advanced-label">
            <DeckIcon name="settings" />
            <span>Preview settings</span>
          </span>
          <DeckIcon name="chevron" className="hud-advanced-chevron" />
        </summary>

        <div className="hud-grid">
          <SegmentedControl
            name="age-band"
            title="Age band"
            icon="age"
            value={props.ageBand}
            options={AGE_OPTIONS}
            onChange={props.onAgeBandChange}
          />
          <SegmentedControl
            name="motion-preference"
            title="Motion"
            icon="motion"
            value={props.motionPreference}
            options={MOTION_OPTIONS}
            onChange={props.onMotionPreferenceChange}
          />
          <SegmentedControl
            name="render-tier"
            title="Render tier"
            icon="tier"
            value={props.renderTierOverride}
            options={TIER_OPTIONS}
            onChange={props.onRenderTierOverrideChange}
          />

          <label className="hud-toggle" data-on={props.plainMode ? "true" : undefined}>
            <span className="hud-field-title as-inline">
              <DeckIcon name="plain" />
              <span>Plain mode</span>
            </span>
            <input
              className="hud-toggle-input"
              type="checkbox"
              name="plain-mode"
              checked={props.plainMode}
              onChange={(event) => props.onPlainModeChange(event.target.checked)}
            />
            <span className="hud-toggle-track" aria-hidden="true">
              <span className="hud-toggle-thumb" />
            </span>
          </label>
        </div>
      </details>
    </section>
  );
}
