"use client";
/**
 * The frosted HUD command cluster (UE044, §U5.9 / UX5) — decluttered to a single focused surface:
 * one **primary action** (Trace lineage), a **compact search**, and two quiet **progressive-disclosure**
 * drawers (Filters = body/thread legend + type toggles; Display = render tier / motion / plain / captions).
 * At rest the rail shows ≤ ~4 controls; the walls of toggles live one tap deeper.
 *
 * Every control is presentation-only: it flips a HUD flag and never touches the `ExplorerView`
 * (SC-E14). Press targets are ≥44px and give scale-0.97 feedback; frequent toggles are instant.
 */
import {
  EDGE_THREADS,
  type ExplorerView,
  MOTION,
  NODE_COLOR_ROLES,
  NODE_GLYPHS,
  SPRINGS,
  type TierOverride,
} from "@gt100k/evidence-explorer-view";
import { EDGE_TYPES, NODE_TYPES } from "@gt100k/evidence-graph";
import type { EdgeType, NodeType } from "@gt100k/evidence-graph";
import { AnimatePresence, motion } from "motion/react";
import { type FormEvent, useId, useState } from "react";
import type { JSX } from "react";
import { Glyph } from "./constellation/glyphs.js";
import { firstSearchMatch, searchMatches } from "./filters.js";
import { type ReducedMotionMode, useHud } from "./hud-state.js";
import {
  ChevronIcon,
  DisplayIcon,
  FiltersIcon,
  FlyToIcon,
  SearchIcon,
  TraceIcon,
} from "./icons.js";
import { useSelection } from "./selection.js";

const NODE_TYPE_LIST = NODE_TYPES as readonly NodeType[];
const EDGE_TYPE_LIST = EDGE_TYPES as readonly EdgeType[];

const TIER_MODES: readonly { readonly value: TierOverride; readonly label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "cinematic", label: "Cinematic" },
  { value: "standard3d", label: "Standard" },
  { value: "calm2d", label: "Calm 2D" },
];

const RM_MODES: readonly { readonly value: ReducedMotionMode; readonly label: string }[] = [
  { value: "system", label: "System" },
  { value: "on", label: "On" },
  { value: "off", label: "Off" },
];

function threadDash(style: (typeof EDGE_THREADS)[EdgeType]["threadStyle"]): string | undefined {
  return style === "dotted"
    ? "1.5 4"
    : style === "dashed-fine"
      ? "4 4"
      : style === "frayed"
        ? "1 3"
        : undefined;
}

/** Which drawer is open — mutually exclusive so the rail never becomes a wall again. */
type Drawer = "filters" | "display" | null;

/** A segmented single-select as a real `radiogroup` (accessible name from its label). */
function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly { readonly value: T; readonly label: string }[];
  onChange: (v: T) => void;
}): JSX.Element {
  const labelId = useId();
  return (
    <div className="hud-field">
      <span className="hud-field-label" id={labelId}>
        {label}
      </span>
      <div className="hud-seg" role="radiogroup" aria-labelledby={labelId}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            className={`hud-seg-btn${value === o.value ? " is-active" : ""}`}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
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
    plainMode,
    togglePlain,
    reducedMotion,
    reducedMotionMode,
    setReducedMotionMode,
    systemReducedMotion,
    tierOverride,
    setTierOverride,
    audioCaptions,
    toggleAudioCaptions,
  } = useHud();
  const { select } = useSelection();
  const [query, setQuery] = useState("");
  const [drawer, setDrawer] = useState<Drawer>(null);
  const searchId = useId();
  const filtersId = useId();
  const displayId = useId();

  const matchCount = searchMatches(view, query).length;
  const hiddenCount = NODE_TYPE_LIST.length - activeTypes.size;

  const runSearch = (e: FormEvent): void => {
    e.preventDefault();
    const first = firstSearchMatch(view, query);
    if (first) select(first);
  };

  const toggleDrawer = (which: Exclude<Drawer, null>): void =>
    setDrawer((cur) => (cur === which ? null : which));

  // Drawer reveal: a soft spring materialise; a plain height/opacity swap under reduced motion.
  const drawerMotion = reducedMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: MOTION.reveal / 1000 },
      }
    : {
        initial: { opacity: 0, height: 0 },
        animate: { opacity: 1, height: "auto" as const },
        exit: { opacity: 0, height: 0 },
        transition: SPRINGS.ui,
      };

  return (
    <aside className="panel hud" aria-label="Observatory controls">
      {/* ── Primary action: trace the provenance lineage ─────────────────────── */}
      <div className="hud-primary">
        <button
          type="button"
          className={`hud-trace${traceActive ? " is-active" : ""}`}
          aria-pressed={traceActive}
          onClick={toggleTrace}
        >
          <span className="hud-trace-icon" aria-hidden="true">
            <TraceIcon size={20} />
          </span>
          <span className="hud-trace-text">
            <span className="hud-trace-title">Trace lineage</span>
            <span className="hud-trace-sub">
              {hasTrace ? "Highlighting the evidence behind the grade" : "Follow the outcome to its roots"}
            </span>
          </span>
        </button>
        <p className="sr-only" aria-live="polite">
          {hasTrace ? "Lineage highlighted — the Ledger marks the same nodes." : "Trace off."}
        </p>
      </div>

      {/* ── Compact search ───────────────────────────────────────────────────── */}
      <form className="hud-find" onSubmit={runSearch} aria-label="Search evidence nodes">
        <label htmlFor={searchId} className="sr-only">
          Search evidence by label or type
        </label>
        <span className="hud-find-icon" aria-hidden="true">
          <SearchIcon />
        </span>
        <input
          id={searchId}
          type="search"
          className="hud-find-input"
          placeholder="Search evidence…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          type="submit"
          className="hud-find-go"
          disabled={matchCount === 0}
          aria-label="Fly to first match"
        >
          <FlyToIcon />
        </button>
      </form>
      {query.trim() !== "" && (
        <p className="hud-caption" aria-live="polite">
          {matchCount} match{matchCount === 1 ? "" : "es"}
        </p>
      )}

      {/* ── Two quiet disclosure tabs — the toggle walls live one tap deeper ──── */}
      <div className="hud-tabs">
        <button
          type="button"
          className={`hud-tab${drawer === "filters" ? " is-open" : ""}`}
          aria-expanded={drawer === "filters"}
          aria-controls={filtersId}
          onClick={() => toggleDrawer("filters")}
        >
          <span className="hud-tab-icon" aria-hidden="true">
            <FiltersIcon />
          </span>
          <span className="hud-tab-label">Filters</span>
          {hiddenCount > 0 && (
            <span className="hud-badge" aria-label={`${hiddenCount} hidden`}>
              {hiddenCount}
            </span>
          )}
          <span className="hud-tab-chevron" aria-hidden="true">
            <ChevronIcon size={16} />
          </span>
        </button>
        <button
          type="button"
          className={`hud-tab${drawer === "display" ? " is-open" : ""}`}
          aria-expanded={drawer === "display"}
          aria-controls={displayId}
          onClick={() => toggleDrawer("display")}
        >
          <span className="hud-tab-icon" aria-hidden="true">
            <DisplayIcon />
          </span>
          <span className="hud-tab-label">Display</span>
          <span className="hud-tab-chevron" aria-hidden="true">
            <ChevronIcon size={16} />
          </span>
        </button>
      </div>

      <AnimatePresence initial={false}>
        {drawer === "filters" && (
          <motion.div
            key="filters"
            id={filtersId}
            className="hud-drawer"
            {...drawerMotion}
          >
            <div className="hud-drawer-inner">
              <div className="hud-drawer-head">
                <span className="hud-drawer-title">Bodies</span>
                <button
                  type="button"
                  className="hud-link"
                  onClick={showAllTypes}
                  disabled={allTypesActive}
                >
                  Show all
                </button>
              </div>
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
                        <svg width={22} height={22} viewBox="-13 -13 26 26" aria-hidden="true">
                          <circle
                            r={12}
                            fill={`var(--${NODE_COLOR_ROLES[t]})`}
                            opacity={on ? 0.2 : 0.06}
                          />
                          <g
                            style={{ color: `var(--${NODE_COLOR_ROLES[t]})`, opacity: on ? 1 : 0.4 }}
                          >
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

              <span className="hud-drawer-title hud-drawer-title--sub">Threads</span>
              <ul className="hud-threads">
                {EDGE_TYPE_LIST.map((t) => (
                  <li key={t} className="hud-thread">
                    <svg width={28} height={10} viewBox="0 0 28 10" aria-hidden="true">
                      <line
                        x1={1}
                        y1={5}
                        x2={27}
                        y2={5}
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
          </motion.div>
        )}

        {drawer === "display" && (
          <motion.div
            key="display"
            id={displayId}
            className="hud-drawer"
            {...drawerMotion}
          >
            <div className="hud-drawer-inner">
              <p className="hud-caption">Presentation only — the evidence never changes.</p>
              <Segmented
                label="Render tier"
                value={tierOverride}
                options={TIER_MODES}
                onChange={setTierOverride}
              />
              <Segmented
                label="Reduced motion"
                value={reducedMotionMode}
                options={RM_MODES}
                onChange={setReducedMotionMode}
              />
              <p className="hud-caption">
                System: {systemReducedMotion ? "reduced" : "full motion"}
              </p>
              <div className="hud-switch-row">
                <button
                  type="button"
                  className={`hud-switch${plainMode ? " is-active" : ""}`}
                  aria-pressed={plainMode}
                  onClick={togglePlain}
                >
                  Plain mode
                </button>
                <button
                  type="button"
                  className={`hud-switch${audioCaptions ? " is-active" : ""}`}
                  aria-pressed={audioCaptions}
                  onClick={toggleAudioCaptions}
                >
                  Audio captions
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
}
