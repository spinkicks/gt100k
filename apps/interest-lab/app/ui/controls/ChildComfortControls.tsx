"use client";

import { type AgeBand, resolveChildStaging } from "@gt100k/interest-lab-view";
import type { CSSProperties, ReactNode, SVGProps } from "react";

export interface ChildComfortControlsProps {
  ageBand: AgeBand;
  /** The effective reduced-motion state — drives the toggle's on/off look. */
  calm: boolean;
  onCalmChange: (calm: boolean) => void;
}

type ComfortGlyphName = "calm" | "help" | "chevron";

const COMFORT_GLYPHS: Record<ComfortGlyphName, ReactNode> = {
  // A crescent moon — "gentle, slower".
  calm: <path d="M20 13.5A8 8 0 1 1 10.5 4a6.5 6.5 0 0 0 9.5 9.5Z" />,
  help: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.2 9.3a2.8 2.8 0 0 1 5.4.9c0 1.9-2.6 2.4-2.6 4" />
      <path d="M12 17.4h.01" />
    </>
  ),
  chevron: <path d="m6 9 6 6 6-6" />,
};

function ComfortGlyph({ name, ...props }: { name: ComfortGlyphName } & SVGProps<SVGSVGElement>) {
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
      {COMFORT_GLYPHS[name]}
    </svg>
  );
}

/**
 * The only chrome a child sees: a calm-mode toggle and a short "how to explore"
 * help card. Everything else (surface switch, age band, render tier, plain
 * mode) lives behind the staff `?debug` harness — a child should meet the world,
 * not a settings wall.
 */
export function ChildComfortControls({ ageBand, calm, onCalmChange }: ChildComfortControlsProps) {
  const style = {
    "--control-target": `${resolveChildStaging(ageBand).touchTargetPx}px`,
  } as CSSProperties;

  return (
    <section
      className="child-comfort control-panel hud-deck material"
      style={style}
      aria-label="Comfort and help"
    >
      <label className="hud-toggle child-comfort-toggle" data-on={calm ? "true" : undefined}>
        <span className="hud-field-title as-inline">
          <ComfortGlyph name="calm" />
          <span className="child-comfort-toggle-copy">
            <span className="child-comfort-toggle-label">Calm mode</span>
            <span className="child-comfort-toggle-hint">Slower, gentle movement</span>
          </span>
        </span>
        <input
          className="hud-toggle-input"
          type="checkbox"
          name="calm-mode"
          checked={calm}
          onChange={(event) => onCalmChange(event.target.checked)}
        />
        <span className="hud-toggle-track" aria-hidden="true">
          <span className="hud-toggle-thumb" />
        </span>
      </label>

      <details className="child-help">
        <summary className="child-help-summary">
          <span className="child-help-label">
            <ComfortGlyph name="help" />
            <span>How to explore</span>
          </span>
          <ComfortGlyph name="chevron" className="child-help-chevron" />
        </summary>
        <ol className="child-help-steps">
          <li>Tap an island to see its quests.</li>
          <li>Tap a quest to add it to My Quests.</li>
          <li>Come back another day — the islands you love will glow.</li>
        </ol>
      </details>
    </section>
  );
}
