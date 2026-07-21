"use client";

import type { MarkerView, ReturnTimelineView, TimelineMarkerKind } from "@gt100k/interest-lab-view";
import { motion } from "motion/react";
import type { CSSProperties } from "react";
import { Glyph, type GlyphName, STATE_GLYPHS } from "../ui/Glyph";
import { resolveGuideMotion, toMotionTransition } from "./motion";

const MARKER_GLYPHS = {
  voluntary: STATE_GLYPHS.voluntaryReturn,
  prompted: STATE_GLYPHS.promptedReturn,
  revision: STATE_GLYPHS.explored,
  challenge: STATE_GLYPHS.new,
  recovery: STATE_GLYPHS.explored,
  scope: STATE_GLYPHS.new,
  artifact: STATE_GLYPHS.met,
  support: STATE_GLYPHS.support,
} as const satisfies Record<TimelineMarkerKind, GlyphName>;

const markerCopy = (marker: MarkerView): string => {
  const day = `Day ${marker.dayOffset}`;

  switch (marker.kind) {
    case "voluntary":
      return `${day} · returned by choice · ${marker.horizon}-day horizon`;
    case "prompted":
      return `${day} · prompted return · ${marker.interventionContext ?? "context recorded"}`;
    case "revision":
      return `${day} · unrequired revision`;
    case "challenge":
      return `${day} · chosen challenge`;
    case "recovery":
      return `${day} · recovery after difficulty`;
    case "scope":
      return `${day} · self-authored scope`;
    case "artifact":
      return `${day} · artifact competence`;
    case "support":
      return `${day} · care marker · never lowers a signal`;
  }
};

export interface ReturnTimelineProps {
  view: ReturnTimelineView;
  reducedMotion: boolean;
}

const TIMELINE_LANE_OFFSETS = ["0rem", "4.25rem", "8.5rem", "12.75rem"] as const;

export function ReturnTimeline({ view, reducedMotion }: ReturnTimelineProps) {
  const lineMotion = resolveGuideMotion("timelineDraw", reducedMotion);
  const range = Math.max(1, view.axisDays.max - view.axisDays.min);

  return (
    <section className="guide-section return-timeline" aria-labelledby="return-timeline-title">
      <header className="guide-section-heading">
        <div>
          <p className="guide-section-name">Return timeline</p>
          <h2 id="return-timeline-title">Choice, prompting, and care stay distinct</h2>
        </div>
        <p>Bright returns were voluntary. Recessed prompts stay visible with their context.</p>
      </header>

      <div
        className="timeline-scroll"
        aria-label="Scrollable return timeline"
        // biome-ignore lint/a11y/noNoninteractiveTabindex: horizontal evidence needs a keyboard-focusable scroll region
        tabIndex={0}
      >
        <div
          className="timeline-plot"
          data-timeline-axis={`${view.axisDays.min}:${view.axisDays.max}`}
        >
          <motion.div
            aria-hidden="true"
            className="timeline-axis"
            data-motion-kind={lineMotion.kind}
            initial={reducedMotion ? false : { scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={toMotionTransition(lineMotion)}
          />
          <span className="timeline-axis-label timeline-axis-label--start">
            Day {view.axisDays.min}
          </span>
          <span className="timeline-axis-label timeline-axis-label--end">
            Day {view.axisDays.max}
          </span>
          <ol className="timeline-markers">
            {view.markers.map((marker, index) => {
              const markerMotion = resolveGuideMotion("markerPop", reducedMotion, index);
              const position = ((marker.dayOffset - view.axisDays.min) / range) * 100;
              const lane = index % TIMELINE_LANE_OFFSETS.length;
              const style = {
                "--timeline-position": `${position}%`,
                "--timeline-lane-offset": TIMELINE_LANE_OFFSETS[lane],
              } as CSSProperties;

              return (
                <motion.li
                  className={`timeline-marker timeline-marker--${marker.kind}`}
                  key={marker.eventId}
                  style={style}
                  data-event-id={marker.eventId}
                  data-lowers-signal={String(marker.lowersSignal)}
                  data-marker-kind={marker.kind}
                  data-motion-kind={markerMotion.kind}
                  data-timeline-lane={lane}
                  data-timeline-marker="true"
                  initial={reducedMotion ? false : { opacity: 0.72, scale: 0.96 }}
                  animate={{ opacity: marker.provenanceRecedes ? 0.68 : 1, scale: 1 }}
                  transition={toMotionTransition(markerMotion)}
                >
                  <span className="timeline-marker-glyph" aria-hidden="true">
                    <Glyph name={MARKER_GLYPHS[marker.kind]} size={18} />
                  </span>
                  <span>{markerCopy(marker)}</span>
                </motion.li>
              );
            })}
          </ol>
        </div>
      </div>

      <ul className="timeline-legend" aria-label="Timeline key">
        {view.legend.map((item) => (
          <li key={item.kind} data-legend-kind={item.kind}>
            <span
              className={`timeline-legend-mark timeline-legend-mark--${item.kind}`}
              aria-hidden="true"
            />
            <span>{item.note}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
