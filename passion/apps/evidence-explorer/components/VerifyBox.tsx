"use client";
/**
 * Compact verify box (§U8.8, simplification pass) — the quiet, text-first replacement for the big
 * cinematic Verify panel. Collapsed it is a single status line (`✓ Verified · merkle root …`); expanded
 * it lists the domain-derived checklist + the full Merkle root (mono, copyable) and offers a small
 * **Show tamper** toggle. There is **no light-wave, no seal-forge, no stepped choreography** — the panel
 * sequences nothing; it just reads the server-derived `VerificationView` truth (no client crypto, no
 * grade computed here).
 *
 * The tamper toggle swaps the displayed root/steps to the tampered view (root diverges, seal reads
 * MISMATCH) AND drives the constellation's byte-level fracture via `onVisualChange` (`resolveVisual`),
 * reusing the existing verify-machine wiring — the fracture stays on the byte-body + root, never a
 * person, learner, `Outcome`, or `Assistance` (SC-E09/UE034). Toggling off returns to Verified.
 */
import { useCallback, useEffect, useState } from "react";
import type { JSX } from "react";
import { ChevronIcon } from "./icons.js";
import { sealCaption } from "./plain.js";
import type { SyntheticVerification } from "./synthetic-view.js";
import {
  IDLE_VISUAL,
  type VerifyVisualState,
  merkleRootOf,
  recomputedRootOf,
  resolveVisual,
  sealAnnouncement,
  shortRoot,
  stepStatusLabel,
} from "./verify-machine.js";

export function VerifyBox({
  verification,
  audioCaptions = false,
  onVisualChange,
}: {
  verification: SyntheticVerification;
  /** Audio captions (§U5.10, muted default): prefix the spoken seal with its neutral caption id. */
  audioCaptions?: boolean;
  onVisualChange?: (state: VerifyVisualState) => void;
}): JSX.Element {
  const [expanded, setExpanded] = useState(false);
  const [tamperOn, setTamperOn] = useState(false);
  const [copied, setCopied] = useState(false);

  const view = tamperOn ? verification.tampered : verification.verified;
  const sealState = view.sealState;
  const verified = sealState === "verified";
  const committedRoot = merkleRootOf(view);
  const recomputedRoot = recomputedRootOf(view);

  // Drive the constellation's byte-fracture on tamper; calm (idle) otherwise. Reuses the existing
  // verify-machine visual wiring — no wave, just the fracture the tier already knows how to render.
  useEffect(() => {
    onVisualChange?.(
      tamperOn
        ? resolveVisual("tamper", verification.tampered, verification.tamperNodeId, 0)
        : IDLE_VISUAL,
    );
    return () => onVisualChange?.(IDLE_VISUAL);
  }, [tamperOn, verification, onVisualChange]);

  const caption = audioCaptions ? sealCaption(sealState) : null;
  const baseAnnounce = sealAnnouncement(view);
  const announce = caption ? `${caption} ${baseAnnounce}` : baseAnnounce;

  const copyRoot = useCallback(() => {
    if (committedRoot === null) return;
    navigator.clipboard?.writeText(committedRoot).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1400);
      },
      () => {
        /* clipboard unavailable — the root stays visible + selectable in the mono field */
      },
    );
  }, [committedRoot]);

  return (
    <section
      className={`verifybox${verified ? "" : " verifybox--mismatch"}`}
      aria-label="Verify milestone"
    >
      <button
        type="button"
        className="verifybox-summary"
        aria-expanded={expanded}
        onClick={() => setExpanded((v) => !v)}
      >
        <span className={`verifybox-seal verifybox-seal--${sealState}`}>
          <span className="verifybox-seal-mark" aria-hidden="true">
            {verified ? "✓" : "✕"}
          </span>
          {verified ? "Verified" : "MISMATCH"}
        </span>
        <span className="verifybox-line">
          <span className="verifybox-line-label">merkle root</span>{" "}
          {verified ? (
            <span className="mono">{shortRoot(committedRoot)}</span>
          ) : (
            <span className="verifybox-diff">
              <span className="mono verifybox-old">{shortRoot(committedRoot)}</span>
              <span className="verifybox-arrow" aria-hidden="true">
                →
              </span>
              <span className="mono verifybox-new">{shortRoot(recomputedRoot)}</span>
            </span>
          )}
        </span>
        <span className={`verifybox-chevron${expanded ? " is-open" : ""}`} aria-hidden="true">
          <ChevronIcon size={16} />
        </span>
      </button>

      {expanded ? (
        <div className="verifybox-detail">
          <ul className="verifybox-steps">
            {view.steps.map((s) => (
              <li key={s.id} className={`verifybox-step verifybox-step--${s.status}`}>
                <span className="verifybox-step-mark" aria-hidden="true">
                  {s.status === "pass" ? "✓" : s.status === "fail" ? "✕" : "◔"}
                </span>
                <span className="verifybox-step-label">{s.label}</span>
                <span className="verifybox-step-status">
                  {stepStatusLabel(s.status)}
                  {s.nonProduction ? " · non-production" : ""}
                </span>
              </li>
            ))}
          </ul>

          <div className="verifybox-root">
            <span className="verifybox-root-label">
              Merkle root{verified ? "" : " (committed)"}
            </span>
            <code className="mono verifybox-root-value">{committedRoot ?? "—"}</code>
            <button
              type="button"
              className="verifybox-copy"
              onClick={copyRoot}
              disabled={committedRoot === null}
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          {!verified && recomputedRoot !== null ? (
            <div className="verifybox-root">
              <span className="verifybox-root-label">Re-derived</span>
              <code className="mono verifybox-root-value verifybox-new">{recomputedRoot}</code>
            </div>
          ) : null}

          <div className="verifybox-actions">
            <button
              type="button"
              className={`verifybox-tamper${tamperOn ? " is-active" : ""}`}
              aria-pressed={tamperOn}
              onClick={() => setTamperOn((v) => !v)}
            >
              {tamperOn ? "Hide tamper" : "Show tamper"}
            </button>
            <span className="verifybox-note">
              Presentation only — no grade, no crypto in the app.
            </span>
          </div>
        </div>
      ) : null}

      {/* Single polite live region for the seal state (calm, non-accusatory). */}
      <output className="sr-only" aria-live="polite">
        {announce}
      </output>
    </section>
  );
}
