"use client";
/**
 * The frosted HUD control cluster (UE044, §U5.9 / UX5) — floats over the void with the **legend**
 * (all 8 node bodies + 6 edge threads as glyph + colour + text — colour never the sole cue), doubling
 * as **type filters** (toggle a body to dim it everywhere), a **"trace from Outcome"** control (the
 * domain-equivalent provenance lineage; the Ledger marks the same subset), and a **search/focus** box.
 *
 * Every control is presentation-only: it flips a HUD flag and never touches the `ExplorerView`
 * (SC-E14). Press targets are ≥44px and give scale-0.97 feedback; frequent toggles are instant.
 */
import {
  EDGE_THREADS,
  type ExplorerView,
  NODE_COLOR_ROLES,
  NODE_GLYPHS,
} from "@gt100k/evidence-explorer-view";
import { EDGE_TYPES, NODE_TYPES } from "@gt100k/evidence-graph";
import type { EdgeType, NodeType } from "@gt100k/evidence-graph";
import { type FormEvent, useId, useState } from "react";
import type { JSX } from "react";
import { Glyph } from "./constellation/glyphs.js";
import { firstSearchMatch, searchMatches } from "./filters.js";
import { useHud } from "./hud-state.js";
import { useSelection } from "./selection.js";

const NODE_TYPE_LIST = NODE_TYPES as readonly NodeType[];
const EDGE_TYPE_LIST = EDGE_TYPES as readonly EdgeType[];

function threadDash(style: (typeof EDGE_THREADS)[EdgeType]["threadStyle"]): string | undefined {
  return style === "dotted"
    ? "1.5 4"
    : style === "dashed-fine"
      ? "4 4"
      : style === "frayed"
        ? "1 3"
        : undefined;
}

export function Hud({ view }: { view: ExplorerView }): JSX.Element {
  const {
    activeTypes,
    toggleType,
    showAllTypes,
    allTypesActive,
    traceActive,
    toggleTrace,
    hasTrace,
  } = useHud();
  const { select } = useSelection();
  const [query, setQuery] = useState("");
  const searchId = useId();

  const matchCount = searchMatches(view, query).length;

  const runSearch = (e: FormEvent): void => {
    e.preventDefault();
    const first = firstSearchMatch(view, query);
    if (first) select(first);
  };

  return (
    <aside className="panel hud" aria-label="Observatory controls">
      {/* ── Legend + type filters ─────────────────────────────────────────── */}
      <div className="hud-section">
        <div className="hud-head">
          <h2 className="hud-title">Bodies</h2>
          <button
            type="button"
            className="hud-link"
            onClick={showAllTypes}
            disabled={allTypesActive}
          >
            Show all
          </button>
        </div>
        <p className="hud-hint">Toggle a body to filter it — presentation only, state unchanged.</p>
        <ul className="hud-filter-grid">
          {NODE_TYPE_LIST.map((t) => {
            const on = activeTypes.has(t);
            return (
              <li key={t}>
                <label className={`hud-filter${on ? " is-on" : " is-off"}`}>
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => toggleType(t)}
                    className="sr-only"
                  />
                  <svg width={24} height={24} viewBox="-13 -13 26 26" aria-hidden="true">
                    <circle
                      r={12}
                      fill={`var(--${NODE_COLOR_ROLES[t]})`}
                      opacity={on ? 0.2 : 0.06}
                    />
                    <g style={{ color: `var(--${NODE_COLOR_ROLES[t]})`, opacity: on ? 1 : 0.4 }}>
                      <Glyph glyph={NODE_GLYPHS[t]} r={7} />
                    </g>
                  </svg>
                  <span className="hud-filter-label">{t}</span>
                  <span className="sr-only">{on ? " (shown)" : " (hidden)"}</span>
                </label>
              </li>
            );
          })}
        </ul>
      </div>

      {/* ── Thread legend (read-only) ─────────────────────────────────────── */}
      <div className="hud-section">
        <h2 className="hud-title">Threads</h2>
        <ul className="hud-threads">
          {EDGE_TYPE_LIST.map((t) => (
            <li key={t} className="hud-thread">
              <svg width={30} height={12} viewBox="0 0 30 12" aria-hidden="true">
                <line
                  x1={1}
                  y1={6}
                  x2={29}
                  y2={6}
                  stroke="var(--ink-muted)"
                  strokeWidth={EDGE_THREADS[t].flow ? 1.8 : 1.2}
                  strokeDasharray={threadDash(EDGE_THREADS[t].threadStyle)}
                />
              </svg>
              <span>{EDGE_THREADS[t].label}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* ── Trace + search ────────────────────────────────────────────────── */}
      <div className="hud-section">
        <h2 className="hud-title">Explore</h2>
        <button
          type="button"
          className={`hud-toggle${traceActive ? " is-active" : ""}`}
          aria-pressed={traceActive}
          onClick={toggleTrace}
        >
          Trace from Outcome
        </button>
        <p className="hud-hint" aria-live="polite">
          {hasTrace
            ? "Highlighting the provenance lineage — the Ledger marks the same subset."
            : "Highlight the evidence supporting the milestone grade."}
        </p>

        <form className="hud-search" onSubmit={runSearch} aria-label="Search evidence nodes">
          <label htmlFor={searchId} className="hud-title" style={{ fontSize: "0.72rem" }}>
            Search / focus
          </label>
          <div className="hud-search-row">
            <input
              id={searchId}
              type="search"
              className="hud-search-input"
              placeholder="node label or type…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit" className="hud-toggle" disabled={matchCount === 0}>
              Focus
            </button>
          </div>
          <p className="hud-hint" aria-live="polite">
            {query.trim() === ""
              ? "Enter a label to fly to the first match."
              : `${matchCount} match${matchCount === 1 ? "" : "es"}`}
          </p>
        </form>
      </div>
    </aside>
  );
}
