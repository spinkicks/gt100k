"use client";

import { type CellView, type CoverageMatrixView, resolveMotion } from "@gt100k/interest-lab-view";
import { motion } from "motion/react";
import type { CSSProperties } from "react";
import { Glyph, type GlyphName, STATE_GLYPHS } from "../ui/Glyph";

const CELL_COPY = {
  voluntary: "Voluntary exploration",
  prompted: "Prompted exploration",
  offered: "Offered",
  empty: "Not yet offered",
} as const satisfies Record<CellView["status"], string>;

const CELL_GLYPHS = {
  voluntary: STATE_GLYPHS.voluntaryReturn,
  prompted: STATE_GLYPHS.promptedReturn,
  offered: STATE_GLYPHS.met,
  empty: STATE_GLYPHS.gap,
} as const satisfies Record<CellView["status"], GlyphName>;

type MotionEasing = "linear" | readonly [number, number, number, number];

const toMotionEasing = (easing: string): MotionEasing => {
  if (easing === "linear") return easing;
  const values = /^cubic-bezier\(([^,]+),([^,]+),([^,]+),([^,]+)\)$/.exec(easing);
  if (values === null) throw new Error(`Unsupported coverage motion easing: ${easing}`);
  return values.slice(1).map(Number) as unknown as readonly [number, number, number, number];
};

const titleCase = (value: string) =>
  value.replaceAll("_", " ").replace(/^./, (character) => character.toUpperCase());

export function resolveCoverageCellMotion(reducedMotion: boolean, index: number) {
  const cell = resolveMotion("matrixCell", { reducedMotion });
  const stagger = resolveMotion("matrixStagger", { reducedMotion });

  return {
    initial: reducedMotion ? (false as const) : { opacity: 0.72 },
    transition: {
      delay: (stagger.durationMs * index) / 1000,
      duration: cell.durationMs / 1000,
      ease: cell.easing,
    },
  };
}

export function resolveCoverageRailMotion(reducedMotion: boolean, index: number) {
  const ticker = resolveMotion("ticker", { reducedMotion });
  const stagger = resolveMotion("matrixStagger", { reducedMotion });

  return {
    initial: reducedMotion ? (false as const) : { opacity: 0.72, y: 6 },
    transition: {
      delay: (stagger.durationMs * index) / 1000,
      duration: ticker.durationMs / 1000,
      ease: ticker.easing,
    },
  };
}

export interface CoverageMatrixProps {
  view: CoverageMatrixView;
  reducedMotion: boolean;
}

export function CoverageMatrix({ view, reducedMotion }: CoverageMatrixProps) {
  return (
    <section
      className="coverage-console"
      aria-labelledby="coverage-console-title"
      data-coverage-state={view.complete ? "complete" : "gappy"}
    >
      <header className="coverage-console-header">
        <div>
          <p className="surface-name">Guide surface</p>
          <h2 id="coverage-console-title">Coverage field map</h2>
        </div>
        <p>
          Each window names what has been offered or explored. Open windows stay visible so the next
          useful test is easy to find.
        </p>
      </header>

      <section
        className="coverage-table-scroll"
        aria-label="Scrollable coverage matrix"
        // biome-ignore lint/a11y/noNoninteractiveTabindex: the horizontally scrollable table must be keyboard-focusable
        tabIndex={0}
      >
        <table className="coverage-table">
          <caption>Coverage across domains and work modes</caption>
          <thead>
            <tr>
              <th className="coverage-domain-heading" scope="col">
                Domain
              </th>
              {view.cols.map((column) => (
                <th key={column.workMode} scope="col">
                  <span className="coverage-column-heading">
                    <span data-glyph={column.glyph} aria-hidden="true">
                      <Glyph name={column.glyph as GlyphName} size={18} />
                    </span>
                    {titleCase(column.workMode)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {view.rows.map((row, rowIndex) => (
              <tr key={row.domain}>
                <th
                  className="coverage-row-heading"
                  scope="row"
                  style={{ "--matrix-row-hue": row.hue } as CSSProperties}
                >
                  <span className="coverage-row-hue" aria-hidden="true" />
                  {titleCase(row.domain)}
                </th>
                {view.cols.map((column, columnIndex) => {
                  const index = rowIndex * view.cols.length + columnIndex;
                  const cell = view.cells[index];
                  if (cell === undefined) {
                    throw new Error(`Missing coverage cell for ${row.domain}/${column.workMode}`);
                  }
                  const motionSpec = resolveCoverageCellMotion(reducedMotion, index);

                  return (
                    <motion.td
                      className={`coverage-cell coverage-cell--${cell.status}`}
                      key={`${row.domain}:${column.workMode}`}
                      data-matrix-cell="true"
                      data-cell-status={cell.status}
                      initial={motionSpec.initial}
                      animate={{ opacity: 1 }}
                      transition={{
                        ...motionSpec.transition,
                        ease: toMotionEasing(motionSpec.transition.ease),
                      }}
                    >
                      <span className="coverage-cell-state">
                        <span
                          className="coverage-state-glyph"
                          data-state-glyph={cell.status}
                          aria-hidden="true"
                        >
                          <Glyph name={CELL_GLYPHS[cell.status]} size={18} />
                        </span>
                        <span>{CELL_COPY[cell.status]}</span>
                      </span>
                    </motion.td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <aside className="coverage-rail" aria-labelledby="coverage-rail-title">
        <div className="coverage-rail-heading">
          <h3 id="coverage-rail-title">Coverage rail</h3>
          <p>Required dimensions stay separate so one met area cannot hide another gap.</p>
        </div>
        <ol className="coverage-rail-list">
          {view.rail.map((item, index) => {
            const state = item.met ? "met" : "gap";
            const motionSpec = resolveCoverageRailMotion(reducedMotion, index);

            return (
              <motion.li
                className={`coverage-rail-item coverage-rail-item--${state}`}
                key={item.dimension}
                data-rail-state={state}
                initial={motionSpec.initial}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  ...motionSpec.transition,
                  ease: toMotionEasing(motionSpec.transition.ease),
                }}
              >
                <span className="coverage-state-glyph" data-state-glyph={state} aria-hidden="true">
                  <Glyph name={item.met ? STATE_GLYPHS.met : STATE_GLYPHS.gap} size={20} />
                </span>
                <span className="coverage-rail-copy">
                  <strong>{item.title}</strong>
                  <span>{item.detail}</span>
                  {item.gapCopy ? <span className="coverage-gap-copy">{item.gapCopy}</span> : null}
                </span>
              </motion.li>
            );
          })}
        </ol>
      </aside>

      {view.gaps.length > 0 ? (
        <section className="coverage-gaps" aria-labelledby="coverage-gaps-title">
          <h3 id="coverage-gaps-title">Still to explore</h3>
          <ul className="coverage-gaps-list">
            {view.gaps.map((gap) => (
              <li key={gap}>
                <span className="coverage-state-glyph" data-state-glyph="gap" aria-hidden="true">
                  <Glyph name={STATE_GLYPHS.gap} size={18} />
                </span>
                <span>{gap}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p className="coverage-complete-note">
          <span className="coverage-state-glyph" aria-hidden="true">
            <Glyph name={STATE_GLYPHS.met} size={20} />
          </span>
          Every required coverage dimension is represented.
        </p>
      )}
    </section>
  );
}
