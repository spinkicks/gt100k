"use client";
/**
 * Drill-down inspector (§U5.8 / UX4) — the frosted, origin-aware `motion@^12` surface that opens when
 * a body is selected. It renders the shared `LedgerPanel` (the exact view-model the accessible Ledger
 * describes to AT — parity by construction) as: a header (type glyph + label; a **human-owned seal**
 * for a grade `Outcome`, a neutral **"Declared AI assistance — cited"** ribbon for a `model`
 * `Assistance`/`Review`), the full content-address (mono, copy button), the neutral actor chip,
 * tool/version, input lineage (each a link that flies to the input body), timestamp, consent scope
 * ("synthetic"), and the type-specific payload. There is **no accusation affordance anywhere**.
 *
 * Motion: Materialize (scale-in from the body's screen origin) on open; under reduced motion it simply
 * fades. The `<Canvas>` stays `aria-hidden`; this panel + the Ledger are the accessible surface.
 */
import type { LedgerPanel, NodeView } from "@gt100k/evidence-explorer-view";
import { MOTION, SPRINGS } from "@gt100k/evidence-explorer-view";
import { motion, useReducedMotion } from "motion/react";
import { useLayoutEffect, useRef, useState } from "react";
import type { JSX } from "react";
import { Glyph } from "./constellation/glyphs.js";
import {
  type SelectionOrigin,
  actorChipView,
  consentLabel,
  headerBadge,
  payloadRows,
  transformOriginFor,
} from "./inspector-model.js";

export function Inspector({
  panel,
  node,
  origin,
  labelFor,
  onSelectInput,
  onClose,
}: {
  panel: LedgerPanel;
  /** The matching node — used only for the decorative type glyph + hue (content comes from `panel`). */
  node: NodeView;
  origin: SelectionOrigin | null;
  /** Readable label for an input node id (fly-to link text). */
  labelFor: (id: string) => string;
  onSelectInput: (id: string) => void;
  onClose: () => void;
}): JSX.Element {
  const prefersReduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [originCss, setOriginCss] = useState("50% 50%");
  const [copied, setCopied] = useState(false);

  // Origin-aware: scale in from the picked body's screen point, expressed against the panel box.
  useLayoutEffect(() => {
    const rect = ref.current?.getBoundingClientRect() ?? null;
    setOriginCss(transformOriginFor(origin, rect));
  }, [origin]);

  const badge = headerBadge(panel);
  const actor = actorChipView(panel.actor);
  const hue = `var(--${node.colorRole})`;

  const copyId = (): void => {
    navigator.clipboard?.writeText(panel.id).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1400);
      },
      () => {
        /* clipboard unavailable — the id stays visible + selectable in the mono field */
      },
    );
  };

  // Materialize on open; fade only under reduced motion.
  const enter = prefersReduced
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, scale: 0.9 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.94 },
      };
  const spring = prefersReduced ? { duration: MOTION.fast / 1000 } : SPRINGS.ui;

  return (
    <motion.aside
      ref={ref}
      className="inspector"
      style={{ transformOrigin: originCss }}
      aria-label={`${panel.type} — ${panel.label} details`}
      initial={enter.initial}
      animate={enter.animate}
      exit={enter.exit}
      transition={spring}
    >
      <header className="insp-header">
        <span className="insp-glyph" style={{ color: hue }} aria-hidden="true">
          <svg viewBox="-14 -14 28 28" width="26" height="26" aria-hidden="true">
            <Glyph glyph={node.glyph} r={11} />
          </svg>
        </span>
        <div className="insp-heading">
          <span className="insp-type" style={{ color: hue }}>
            {panel.type}
          </span>
          <h3 className="insp-label">{panel.label}</h3>
        </div>
        <button type="button" className="insp-close" onClick={onClose} aria-label="Close details">
          <span aria-hidden="true">×</span>
        </button>
      </header>

      {badge.kind === "human-owned" ? (
        <p className="insp-badge insp-badge--human">
          <span className="insp-seal" aria-hidden="true">
            ✶
          </span>
          {badge.text}
        </p>
      ) : null}
      {badge.kind === "cited" ? (
        <p className="insp-badge insp-badge--cited">
          <span className="insp-ribbon" aria-hidden="true">
            ❝
          </span>
          {badge.text}
        </p>
      ) : null}

      <dl className="insp-fields">
        <div className="insp-field insp-field--address">
          <dt>Content-address</dt>
          <dd>
            <code className="mono insp-hash">{panel.id}</code>
            <button type="button" className="insp-copy" onClick={copyId}>
              {copied ? "Copied" : "Copy"}
            </button>
            <span className="insp-note">content-addressed — the id is the hash of the content</span>
          </dd>
        </div>

        <div className="insp-field">
          <dt>Actor</dt>
          <dd>
            <span className={`insp-chip insp-chip--${actor.kind}`}>{actor.kindLabel}</span>
            <span className="mono insp-ref">{actor.ref}</span>
          </dd>
        </div>

        {panel.tool ? (
          <div className="insp-field">
            <dt>Tool</dt>
            <dd className="mono">
              {panel.tool.name}
              <span className="insp-note">v{panel.tool.version}</span>
            </dd>
          </div>
        ) : null}

        <div className="insp-field">
          <dt>Inputs</dt>
          <dd>
            {panel.inputs.length === 0 ? (
              <span className="insp-empty">No upstream inputs (a source of the milestone).</span>
            ) : (
              <ul className="insp-inputs">
                {panel.inputs.map((id) => (
                  <li key={id}>
                    <button
                      type="button"
                      className="insp-input-link"
                      onClick={() => onSelectInput(id)}
                    >
                      <span aria-hidden="true">↗</span> {labelFor(id)}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </dd>
        </div>

        <div className="insp-field">
          <dt>Timestamp</dt>
          <dd className="mono">{panel.timestamp}</dd>
        </div>

        <div className="insp-field">
          <dt>Consent scope</dt>
          <dd>
            {consentLabel(panel)} <span className="insp-tag">synthetic</span>
          </dd>
        </div>

        <div className="insp-field">
          <dt>Payload</dt>
          <dd>
            {payloadRows(panel).length === 0 ? (
              <span className="insp-empty">No payload fields.</span>
            ) : (
              <ul className="insp-payload">
                {payloadRows(panel).map(([k, v]) => (
                  <li key={k}>
                    <span className="insp-key">{k}</span>
                    <span className="insp-val">{v}</span>
                  </li>
                ))}
              </ul>
            )}
          </dd>
        </div>
      </dl>
    </motion.aside>
  );
}
