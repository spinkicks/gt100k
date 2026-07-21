"use client";
/**
 * Verify panel (§U5.3 / §U8.8, UE032–UE035) — the reviewer's cinematic Verify control and its
 * accessible twin. Pressing **Verify** replays the server-derived `VerificationView`: a light-wave
 * sweeps the cosmos edge-by-edge (`verifyWave` 1800ms, order = `view.verifyWaveOrder`) while the
 * checklist ticks row-by-row (`verifyStep` 420ms Pop each), then the milestone locks into a golden
 * **Verified ✓ seal** and the Merkle root **ticks in** (`rootTick`), announced via `aria-live`.
 *
 * The **tamper demo** replays the tampered view: `merkle-root` turns `fail`, the byte-level released
 * Artifact **fractures** (bytes only, `fracture` 520ms), its lineage desaturates, the root **diverges**
 * old → new (`rootDiverge`), and a **MISMATCH** seal appears in `--tamper`. Per SC-E09/UE034 the red,
 * the fracture, and the diverging root touch **only** the byte-body + the root — never a person,
 * learner, `Outcome`, or `Assistance`.
 *
 * Reduced motion (calm-2D): no light-wave / bloom / fracture is required to understand the result — the
 * whole checklist + the Verified/MISMATCH badge + the root(s) render instantly with an `aria-live`
 * announce (acceptance scenario 4). The panel computes **no** grade and **no** crypto; it sequences the
 * domain truth only.
 */
import { MOTION, type VerificationView } from "@gt100k/evidence-explorer-view";
import { useCallback, useEffect, useRef, useState } from "react";
import type { JSX } from "react";
import { sealCaption } from "./plain.js";
import type { SyntheticVerification } from "./synthetic-view.js";
import {
  IDLE_VISUAL,
  type VerifyRun,
  type VerifyVisualState,
  merkleRootOf,
  recomputedRootOf,
  resolveVisual,
  revealedStepCount,
  sealAnnouncement,
  shortRoot,
  stepStatusLabel,
  waveLitCount,
} from "./verify-machine.js";

/** A run's playback: the domain view + how many wave edges / step rows are currently revealed. */
interface Playback {
  readonly run: VerifyRun;
  readonly litEdgeCount: number;
  readonly revealedSteps: number;
  readonly done: boolean;
}

const IDLE_PLAYBACK: Playback = { run: "idle", litEdgeCount: 0, revealedSteps: 0, done: false };

function viewFor(run: VerifyRun, v: SyntheticVerification): VerificationView | null {
  if (run === "verify") return v.verified;
  if (run === "tamper") return v.tampered;
  return null;
}

export function VerifyPanel({
  verification,
  reducedMotion,
  audioCaptions = false,
  onVisualChange,
}: {
  verification: SyntheticVerification;
  reducedMotion: boolean;
  /** Audio captions (§U5.10, muted default): prefix the spoken seal with its neutral caption id. */
  audioCaptions?: boolean;
  onVisualChange?: (state: VerifyVisualState) => void;
}): JSX.Element {
  const [playback, setPlayback] = useState<Playback>(IDLE_PLAYBACK);
  const raf = useRef<number | null>(null);
  const startedAt = useRef<number | null>(null);

  const view = viewFor(playback.run, verification);
  const totalEdges = verification.verified.verifyWaveOrder.length;
  const totalSteps = verification.verified.steps.length;

  // Publish the visual state up to the stage so the active tier can render the wave/seal/fracture.
  useEffect(() => {
    const visual =
      view === null
        ? IDLE_VISUAL
        : resolveVisual(playback.run, view, verification.tamperNodeId, playback.litEdgeCount);
    onVisualChange?.(visual);
  }, [view, playback.run, playback.litEdgeCount, verification.tamperNodeId, onVisualChange]);

  const stopRaf = useCallback(() => {
    if (raf.current !== null) cancelAnimationFrame(raf.current);
    raf.current = null;
    startedAt.current = null;
  }, []);

  useEffect(() => stopRaf, [stopRaf]);

  const play = useCallback(
    (run: VerifyRun) => {
      stopRaf();
      // Reduced motion: reveal the whole result at once (§U8.5 reduced column) — no animation needed.
      if (reducedMotion) {
        setPlayback({ run, litEdgeCount: totalEdges, revealedSteps: totalSteps, done: true });
        return;
      }
      setPlayback({ run, litEdgeCount: 0, revealedSteps: 1, done: false });
      const step = (now: number): void => {
        if (startedAt.current === null) startedAt.current = now;
        const elapsed = now - startedAt.current;
        const lit = waveLitCount(totalEdges, elapsed, MOTION.verifyWave);
        const steps = revealedStepCount(totalSteps, elapsed, MOTION.verifyStep);
        const finished = elapsed >= MOTION.verifyWave;
        setPlayback({
          run,
          litEdgeCount: lit,
          revealedSteps: steps,
          done: finished,
        });
        if (!finished) {
          raf.current = requestAnimationFrame(step);
        } else {
          stopRaf();
        }
      };
      raf.current = requestAnimationFrame(step);
    },
    [reducedMotion, stopRaf, totalEdges, totalSteps],
  );

  const reset = useCallback(() => {
    stopRaf();
    setPlayback(IDLE_PLAYBACK);
  }, [stopRaf]);

  const isTamper = playback.run === "tamper";
  const sealState = view?.sealState ?? "unverified";
  const committedRoot = view ? merkleRootOf(view) : null;
  const recomputedRoot = view ? recomputedRootOf(view) : null;
  const baseAnnounce = view && playback.done ? sealAnnouncement(view) : "";
  // Audio captions (muted default, §U5.10): when on, lead the spoken seal with its neutral caption id.
  const caption = audioCaptions ? sealCaption(sealState) : null;
  const announce = baseAnnounce && caption ? `${caption} ${baseAnnounce}` : baseAnnounce;

  return (
    <section className={`verify${isTamper ? " verify--tamper" : ""}`} aria-label="Verify milestone">
      <div className="verify-head">
        <h2 className="verify-title">Verify</h2>
        <div className="verify-actions">
          <button
            type="button"
            className="verify-btn verify-btn--primary"
            onClick={() => play("verify")}
            aria-pressed={playback.run === "verify"}
          >
            <span aria-hidden="true">✦</span> Verify
          </button>
          <button
            type="button"
            className="verify-btn verify-btn--tamper"
            onClick={() => play("tamper")}
            aria-pressed={playback.run === "tamper"}
          >
            <span aria-hidden="true">⚠</span> Run tamper demo
          </button>
          <button
            type="button"
            className="verify-btn"
            onClick={reset}
            disabled={playback.run === "idle"}
          >
            Reset
          </button>
        </div>
      </div>

      <p className="verify-intro">
        Re-derives the Merkle root, checks the attestation subject digest and human-owned final
        grade, and notes the (pre-live, stubbed) transparency-log step. The app computes no grade.
      </p>

      {/* The seal — a static, text-first badge so meaning never depends on the 3D light-wave. Not a
          live region itself: the single `<output>` below carries the spoken announcement (one region). */}
      <div className={`verify-seal verify-seal--${sealState}`} data-state={sealState}>
        <span className="verify-seal-icon" aria-hidden="true">
          {sealState === "verified" ? "✓" : sealState === "mismatch" ? "✕" : "…"}
        </span>
        <span className="verify-seal-text">
          {sealState === "verified"
            ? "Verified"
            : sealState === "mismatch"
              ? "MISMATCH"
              : "Not yet verified"}
        </span>
      </div>

      {/* The checklist — the accessible truth. Rows tick in order; each carries a text status. */}
      <ol className="verify-steps">
        {(view ?? verification.verified).steps.map((s, i) => {
          const revealed = view !== null && i < playback.revealedSteps;
          const shown = revealed ? s.status : "pending";
          return (
            <li
              key={s.id}
              className={`verify-step verify-step--${shown}${revealed ? " is-revealed" : ""}`}
              aria-current={revealed && i === playback.revealedSteps - 1 ? "step" : undefined}
            >
              <span className="verify-step-mark" aria-hidden="true">
                {shown === "pass" ? "✓" : shown === "fail" ? "✕" : shown === "stub" ? "◔" : "·"}
              </span>
              <span className="verify-step-body">
                <span className="verify-step-label">{s.label}</span>
                <span className="verify-step-status">
                  {revealed ? stepStatusLabel(s.status) : "Pending"}
                  {s.nonProduction ? " · non-production" : ""}
                </span>
              </span>
            </li>
          );
        })}
      </ol>

      {/* Merkle root — ticks in on verify; diverges old→new on tamper (mono, tabular). */}
      {view && playback.done ? (
        <div className="verify-root">
          <span className="verify-root-label">Merkle root</span>
          {sealState === "mismatch" ? (
            <span className="verify-root-diff">
              <span className="verify-root-old mono">committed {shortRoot(committedRoot)}</span>
              <span className="verify-root-arrow" aria-hidden="true">
                →
              </span>
              <span className="verify-root-new mono">re-derived {shortRoot(recomputedRoot)}</span>
            </span>
          ) : (
            <span className="verify-root-value mono" title={committedRoot ?? undefined}>
              {shortRoot(committedRoot)}
            </span>
          )}
        </div>
      ) : null}

      {/* Single polite live region for the finished announcement (calm, non-accusatory).
          `<output>` carries an implicit `status` role, so it announces without a redundant attribute. */}
      <output className="sr-only" aria-live="polite">
        {announce}
      </output>
    </section>
  );
}
