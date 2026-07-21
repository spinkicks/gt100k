"use client";
/**
 * Accessible Provenance Ledger (§U5.12 / UX4, SC-E10) — the parallel DOM the app renders alongside
 * the decorative, `aria-hidden` constellation. It renders the server-built `LedgerView` as a
 * keyboard-navigable `role="tree"`: one `treeitem` per node (its accessible name = type + label +
 * state + actor + human-owned/cited marker), each with a **described panel region** (id / actor /
 * tool / inputs / timestamp / consent / payload) so assistive tech reaches exactly the same evidence
 * the visual `Inspector` shows — parity by construction (both consume one `LedgerView`).
 *
 * Selecting a row is the same action as picking a body: it opens the `Inspector`, flies the camera,
 * and marks the beat. Human authority is stated positively (a human-owned seal; a neutral cited-AI
 * ribbon) and there is **no accusation affordance** anywhere.
 *
 * Chrome: a fixed HUD header (title + tabular count) sits above a masked, edge-faded scroll region
 * so rows dissolve into the panel rather than hard-clipping — depth, not a table (apple-design §12).
 */
import type { LedgerView } from "@gt100k/evidence-explorer-view";
import { useMemo } from "react";
import type { JSX } from "react";
import { useHud } from "./hud-state.js";
import { actorChipView, consentLabel, headerBadge, payloadRows } from "./inspector-model.js";
import { panelCopy, sealCaption } from "./plain.js";
import { useSelection } from "./selection.js";

export function Ledger({ ledger }: { ledger: LedgerView }): JSX.Element {
  const { select, selectedNodeId } = useSelection();
  const { emphasisFor, hasTrace, allTypesActive, plainMode, audioCaptions } = useHud();
  const copy = panelCopy(plainMode);
  // Only the accessible "marked subset" note matters when a filter or trace is actually active.
  const marking = hasTrace || !allTypesActive;
  const labelById = useMemo(
    () => new Map(ledger.tree.map((t) => [t.id, `${t.type} — ${t.label}`])),
    [ledger.tree],
  );
  const verification = ledger.verification;
  const caption = verification && audioCaptions ? sealCaption(verification.sealState) : null;

  return (
    <section className="panel ledger" aria-label="Provenance ledger">
      <header className="ledger-head">
        <h2 className="ledger-title">Ledger</h2>
        <span className="ledger-count mono" aria-hidden="true">
          {ledger.tree.length}
        </span>
      </header>

      <div className="ledger-scroll">
        {/* Verification status — the accessible parallel of the Verify seal (§U12, SC-E10): a status
            list + a polite live region so AT hears the outcome. Captions (muted default) prefix the id. */}
        {verification ? (
          <div className="ledger-verify" aria-label="Verification status">
            <ul className="ledger-verify-steps">
              {verification.steps.map((s) => (
                <li key={s.id} className={`ledger-verify-step ledger-verify-step--${s.status}`}>
                  <span className="ledger-verify-mark" aria-hidden="true">
                    {s.status === "pass" ? "✓" : s.status === "fail" ? "✕" : "◔"}
                  </span>
                  <span>
                    {s.label} — {s.statusText}
                    {s.nonProduction ? " (non-production)" : ""}
                  </span>
                </li>
              ))}
            </ul>
            <p className="ledger-seal" aria-live="polite">
              {caption ? <span className="ledger-caption mono">{caption} </span> : null}
              {verification.sealText}
            </p>
          </div>
        ) : null}

        <ul className="ledger-tree" role="tree" aria-label="Evidence nodes in provenance order">
          {ledger.tree.map((item) => {
            const badge = headerBadge(item.panel);
            const actor = actorChipView(item.panel.actor);
            const panelId = `ledger-panel-${item.id.slice(0, 12)}`;
            const selected = selectedNodeId === item.id;
            const emphasis = emphasisFor(item.id);
            // The Ledger marks the exact same subset the constellation highlights (SC-E10 parity).
            const marked = marking && emphasis !== "dimmed";
            return (
              <li
                key={item.id}
                role="treeitem"
                aria-level={item.depthRank + 1}
                aria-selected={selected}
                className={`ledger-node${selected ? " is-selected" : ""} ledger-node--${emphasis}`}
              >
                <button
                  type="button"
                  className="ledger-row"
                  aria-describedby={panelId}
                  onClick={() => select(item.id)}
                >
                  <span
                    className="ledger-dot"
                    style={{ color: `var(--${item.type.toLowerCase()})` }}
                    aria-hidden="true"
                  />
                  <span className="ledger-name">{item.accessibleName}</span>
                  {marked ? (
                    <span className="sr-only">
                      {emphasis === "traced" ? " — in the traced lineage" : " — matches the filter"}
                    </span>
                  ) : null}
                </button>

                {/* Described panel region — the parity content AT reads for this node (§U5.12). */}
                <div id={panelId} className="ledger-panel">
                  {badge.kind !== "none" ? (
                    <p
                      className={`ledger-flag ledger-flag--${badge.kind === "human-owned" ? "human" : "model"}`}
                    >
                      {badge.text}
                    </p>
                  ) : null}
                  <dl className="ledger-panel-fields">
                    <dt>{copy.addressLabel}</dt>
                    <dd>
                      <code className="mono">{item.panel.id}</code>
                    </dd>
                    <dt>Actor</dt>
                    <dd>
                      {actor.kindLabel} · <span className="mono">{actor.ref}</span>
                    </dd>
                    {item.panel.tool ? (
                      <>
                        <dt>Tool</dt>
                        <dd className="mono">
                          {item.panel.tool.name} v{item.panel.tool.version}
                        </dd>
                      </>
                    ) : null}
                    <dt>Inputs</dt>
                    <dd>
                      {item.panel.inputs.length === 0
                        ? copy.inputsEmpty
                        : item.panel.inputs.map((id) => labelById.get(id) ?? id).join("; ")}
                    </dd>
                    <dt>Timestamp</dt>
                    <dd className="mono">{item.panel.timestamp}</dd>
                    <dt>Consent scope</dt>
                    <dd>{consentLabel(item.panel)} (synthetic)</dd>
                    {payloadRows(item.panel).map(([k, v]) => (
                      <div key={k} className="ledger-payload-row">
                        <dt>{k}</dt>
                        <dd>{v}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
