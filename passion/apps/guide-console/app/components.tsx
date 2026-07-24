"use client";

// Shared, reference-styled UI atoms. Monochrome + grayscale-safe: lifecycle state is a dot + label,
// evidence sign is a +/- glyph + a heading. Every piece of jargon is a plain-language label (vocab.ts)
// with a description on hover/focus and in the Key. No raw variable names, no underscores, no em dashes.
import { useState, type JSX } from "react";
import { childInitials } from "./console-data.js";
import type { ConsoleController } from "./useConsole.js";
import type { HypothesisCard } from "@gt100k/hypothesis-store";
import { ProgressRing } from "./progress.js";
import {
  ACTIONS,
  SIGNALS,
  STATES,
  actionTerm,
  attributionTerm,
  domainLabel,
  modeLabel,
  modeTerm,
  signal,
  specPath,
  stateTerm,
} from "./vocab.js";

export const STATE_ORDER = [
  "EXPLORING",
  "EMERGING",
  "CANDIDATE",
  "ACTIVE",
  "REOPENED",
  "CONTESTED",
  "PARKED",
] as const;

export const pretty = (s: string): string => stateTerm(s).label;

const ICON_PATHS: Record<string, string> = {
  brand: "M12 3v3M12 18v3M3 12h3M18 12h3M6 6l2 2M16 16l2 2M18 6l-2 2M8 16l-2 2",
  layers: "M12 3 3 8l9 5 9-5-9-5ZM3 13l9 5 9-5",
  tracked: "M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3ZM4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3",
  calibrated: "M5 19a8 8 0 1 1 14 0M12 19l3.5-4.5",
  gate: "M6 21V4M6 4h11l-2 3.5L17 11H6",
  help: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18M9.6 9.4a2.4 2.4 0 0 1 4.6.9c0 1.6-2.2 1.9-2.2 3.2M12 17.2h.01",
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14M20 20l-3.6-3.6",
};

export function Icon({ name, size = 18 }: { name: string; size?: number }): JSX.Element {
  return (
    <svg
      className="icon"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICON_PATHS[name]
        ?.split("M")
        .filter(Boolean)
        .map((d, i) => (
          <path key={i} d={`M${d}`} />
        ))}
    </svg>
  );
}

// Inline term with a plain-language tooltip on hover/focus (keyboard reachable).
export function Term({
  label,
  desc,
  className,
}: {
  label: string;
  desc: string;
  className?: string;
}): JSX.Element {
  if (!desc) return <span className={className}>{label}</span>;
  return (
    <span
      className={`term${className ? ` ${className}` : ""}`}
      tabIndex={0}
      data-tip={desc}
      aria-label={`${label}. ${desc}`}
    >
      {label}
    </span>
  );
}

export function Brand(): JSX.Element {
  return (
    <div className="brand">
      <span className="brand__mark" aria-hidden="true">P</span>
      <span className="brand__title">PassionLab Guide Console</span>
    </div>
  );
}

export function StatePill({ state }: { state: string }): JSX.Element {
  const t = stateTerm(state);
  return (
    <span
      className={`pill pill--${state.toLowerCase()}`}
      data-state={state}
      title={t.desc}
      aria-label={`${t.label}. ${t.desc}`}
    >
      <span className="pill__dot" aria-hidden="true" /> {t.label}
    </span>
  );
}

export function CellTitle({ card }: { card: HypothesisCard }): JSX.Element {
  return (
    <span className="cell">
      {card.domainPath.map((seg, i) => (
        <span key={seg}>
          {i > 0 && (
            <span className="cell__sep" aria-hidden="true">
              ›
            </span>
          )}
          {domainLabel(seg)}
        </span>
      ))}
    </span>
  );
}

// The work-mode chip (Build / Compete / Perform …), pinned to the card's top-right.
export function ModeChip({ card }: { card: HypothesisCard }): JSX.Element {
  const t = modeTerm(card.mode);
  return (
    <span className="cell__mode" tabIndex={0} data-tip={t.desc} aria-label={`${t.label}. ${t.desc}`}>
      {t.label}
    </span>
  );
}

// Names the concrete driver behind the attribution, e.g. "work-style: Build" or "topic: Chess", so a
// guide isn't left wondering *which* style or topic it means.
function attributionView(card: HypothesisCard): { label: string; desc: string } | null {
  if (!card.attribution) return null;
  const base = attributionTerm(card.attribution);
  if (card.attribution === "style") {
    return { label: `Work-style (${modeLabel(card.mode)})`, desc: base.desc };
  }
  if (card.attribution === "domain") {
    const leaf = card.domainPath[card.domainPath.length - 1] ?? card.domainPath[0] ?? "";
    return { label: `Topic (${domainLabel(leaf)})`, desc: base.desc };
  }
  return { label: base.label, desc: base.desc };
}

export function LowerBound({ card }: { card: HypothesisCard }): JSX.Element {
  const a = attributionView(card);
  return (
    <div className="lb">
      <div className="lb__row">
        <span className="lb__val">
          <Term
            label="Lower-bound"
            desc="A conservative floor for how strong this interest looks, not a score or a label. Higher means the evidence is more convincing."
          />
          {": "}
          <span className="mono strong">{card.lowerBound.toFixed(2)}</span>
        </span>
        <Term
          className={card.confident ? "lb__cal is-cal" : "lb__cal"}
          label={card.confident ? "Calibrated" : "Uncertain"}
          desc={
            card.confident
              ? "Enough evidence has accrued to trust this estimate."
              : "Not enough evidence yet, so treat this as provisional."
          }
        />
      </div>
      {a ? (
        <div className="lb__driver">
          <span className="lb__driverk">Driver:</span> <Term label={a.label} desc={a.desc} />
        </div>
      ) : null}
    </div>
  );
}

function EvidenceColumn({
  items,
  kind,
  heading,
  verbose,
}: {
  items: readonly string[];
  kind: "pos" | "neg";
  heading: string;
  verbose: boolean;
}): JSX.Element {
  return (
    <div className={`ev2col ev2col--${kind}`}>
      <h4>{heading}</h4>
      {items.length ? (
        <ul>
          {items.map((k) => {
            const t = signal(k);
            return (
              <li key={k}>
                {verbose ? (
                  <>
                    <span className="ev2label">{t.label}</span>
                    {t.desc && <span className="ev2desc">{t.desc}</span>}
                  </>
                ) : (
                  <Term label={t.label} desc={t.desc} />
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="ev2none">none yet</p>
      )}
    </div>
  );
}

export function Evidence({
  card,
  verbose = false,
}: {
  card: HypothesisCard;
  verbose?: boolean;
}): JSX.Element {
  return (
    <div className={`ev2${verbose ? " ev2--verbose" : ""}`}>
      <EvidenceColumn items={card.supporting} kind="pos" heading="Supporting" verbose={verbose} />
      <EvidenceColumn
        items={card.disconfirming}
        kind="neg"
        heading="Disconfirming"
        verbose={verbose}
      />
    </div>
  );
}

export function Probe({ card }: { card: HypothesisCard }): JSX.Element {
  return (
    <p className="probe2">
      <span className="probe2__k">Next test</span>
      <span>{card.nextProbe}</span>
    </p>
  );
}

export function Actions({
  card,
  ctrl,
}: {
  card: HypothesisCard;
  ctrl: ConsoleController;
}): JSX.Element {
  return (
    <div className="acts" role="group" aria-label={`Actions for ${card.cellKey}`}>
      {card.allowedActions.map((action) => {
        const t = actionTerm(action);
        return (
          <button
            key={action}
            type="button"
            className={`btn${action === "promote" ? " btn--go" : ""}`}
            disabled={ctrl.isDisabled(action, card)}
            onClick={() => ctrl.runAction(action, card)}
            data-tip={t.desc}
            aria-label={`${t.label}. ${t.desc}`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

// A single specialty card: the recurring unit across the grid / detail prototypes.
export function SpecCard({
  card,
  ctrl,
  domId,
}: {
  card: HypothesisCard;
  ctrl: ConsoleController;
  domId?: string;
}): JSX.Element {
  const on = ctrl.selectedId === card.id;
  return (
    <article id={domId} className={`hcard${on ? " hcard--selected" : ""}`}>
      <div className="hcard__top">
        <CellTitle card={card} />
        <ModeChip card={card} />
      </div>
      <LowerBound card={card} />
      <Evidence card={card} />
      <Probe card={card} />
      <div className="hcard__foot">
        <Actions card={card} ctrl={ctrl} />
        <ProgressRing state={card.state} gate={card.gate} size={54} />
      </div>
    </article>
  );
}

export function FilterNav({ ctrl }: { ctrl: ConsoleController }): JSX.Element {
  const filters = [
    { key: "ALL" as const, label: "All hypotheses", count: ctrl.vm.cards.length },
    ...STATE_ORDER.filter((s) => ctrl.counts.has(s)).map((s) => ({
      key: s as string,
      label: stateTerm(s).label,
      count: ctrl.counts.get(s) ?? 0,
    })),
  ];
  return (
    <nav className="nav" aria-label="Filter hypotheses by lifecycle state">
      <p className="nav__label">View</p>
      {filters.map((f) => (
        <button
          key={f.key}
          type="button"
          className={`nav__item${ctrl.filter === f.key ? " nav__item--active" : ""}`}
          aria-current={ctrl.filter === f.key ? "page" : undefined}
          onClick={() => ctrl.setFilter(f.key)}
        >
          <span className="nav__lead">
            {f.key === "ALL" ? (
              <Icon name="layers" size={16} />
            ) : (
              <span className={`dot dot--${String(f.key).toLowerCase()}`} aria-hidden="true" />
            )}
            <span>{f.label}</span>
          </span>
          <span className="nav__count">{f.count}</span>
        </button>
      ))}
    </nav>
  );
}

// Children switcher with a search box (guides will have many children to page through).
export function ChildSwitcher({ ctrl }: { ctrl: ConsoleController }): JSX.Element {
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();
  const list = query
    ? ctrl.children.filter((c) => c.name.toLowerCase().includes(query))
    : ctrl.children;
  return (
    <div className="kids">
      <p className="nav__label">Children</p>
      <div className="search">
        <Icon name="search" size={15} />
        <input
          type="search"
          className="search__input"
          placeholder="Search children"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search children"
        />
      </div>
      <div className="kids__list">
        {list.length === 0 ? (
          <p className="kids__empty">No matches</p>
        ) : (
          list.map((c) => {
            const s = ctrl.summaries.get(c.id) ?? { tracked: 0, gateReady: 0, topState: null };
            const active = ctrl.kid === c.id;
            return (
              <button
                key={c.id}
                type="button"
                className={`kid${active ? " kid--active" : ""}`}
                aria-current={active ? "true" : undefined}
                onClick={() => ctrl.setKid(c.id)}
              >
                <span className="kid__av" aria-hidden="true">
                  {childInitials(c.name)}
                </span>
                <span className="kid__meta">
                  <span className="kid__name">{c.name}</span>
                  <span className="kid__sub">
                    {s.tracked} tracked{s.gateReady ? ` · ${s.gateReady} ready` : ""}
                  </span>
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

// Clickable list of the current child's specializations (interest hypotheses).
export function SpecRail({
  ctrl,
  onPick,
}: {
  ctrl: ConsoleController;
  onPick?: (card: HypothesisCard, index: number) => void;
}): JSX.Element {
  const selId = ctrl.selectedCard?.id ?? null;
  return (
    <nav className="rail" aria-label="Specializations">
      <p className="nav__label">Specializations</p>
      {ctrl.vm.cards.length === 0 ? (
        <p className="rail__empty">None yet</p>
      ) : (
        ctrl.vm.cards.map((card, i) => {
          const on = selId === card.id;
          return (
            <button
              key={card.id}
              type="button"
              className={`railitem${on ? " on" : ""}`}
              aria-current={on ? "true" : undefined}
              onClick={() => (onPick ? onPick(card, i) : ctrl.setSelectedId(card.id))}
            >
              <span className={`dot dot--${card.state.toLowerCase()}`} aria-hidden="true" />
              <span className="railitem__meta">
                <span className="railitem__name">{specPath(card.domainPath)}</span>
                <span className="railitem__sub">
                  {stateTerm(card.state).label} · {modeLabel(card.mode)}
                </span>
              </span>
            </button>
          );
        })
      )}
    </nav>
  );
}

export function EmptyState({ ctrl }: { ctrl: ConsoleController }): JSX.Element {
  return (
    <p className="empty" role="status">
      {ctrl.vm.cards.length === 0
        ? "No hypotheses yet. Exploration in progress."
        : "No hypotheses in this view."}
    </p>
  );
}

// The Key: plain-language definitions for every term. Collapsible; pass `open` to keep it expanded.
export function Legend({ open = false }: { open?: boolean }): JSX.Element {
  const group = (
    title: string,
    entries: [string, { label: string; desc: string }][],
  ): JSX.Element => (
    <div className="legend__group">
      <h5>{title}</h5>
      <dl>
        {entries.map(([k, t]) => (
          <div className="legend__row" key={k}>
            <dt>{t.label}</dt>
            <dd>{t.desc}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
  return (
    <details className="legend" open={open || undefined}>
      <summary className="legend__summary">
        <Icon name="help" size={15} />
        Key: what these terms mean
      </summary>
      <div className="legend__body">
        {group("Lifecycle", Object.entries(STATES))}
        {group("Evidence signals", Object.entries(SIGNALS))}
        {group("Actions", Object.entries(ACTIONS))}
      </div>
    </details>
  );
}

