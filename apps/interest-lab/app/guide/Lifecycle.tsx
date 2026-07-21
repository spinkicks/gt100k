"use client";

import type { HypothesisState } from "@gt100k/interest-lab";
import type { LifecycleStateView } from "@gt100k/interest-lab-view";
import { motion } from "motion/react";
import type { CSSProperties } from "react";
import { Glyph, STATE_GLYPHS } from "../ui/Glyph";
import type { GuideAuthoringInput } from "./authoring";
import { resolveGuideMotion, toMotionTransition } from "./motion";

const titleCase = (value: string) =>
  value.replaceAll("_", " ").replace(/^./, (character) => character.toUpperCase());

const stateGlyph = (state: HypothesisState) => {
  if (state === "CONTESTED") return STATE_GLYPHS.contested;
  if (state === "PARKED") return STATE_GLYPHS.parked;
  return STATE_GLYPHS.met;
};

export interface LifecycleProps {
  view: LifecycleStateView;
  reducedMotion: boolean;
  onAuthorRevision?: (input: GuideAuthoringInput) => void;
}

export function Lifecycle({ view, reducedMotion, onAuthorRevision }: LifecycleProps) {
  const stateMotion = resolveGuideMotion("stateMorph", reducedMotion);
  const mainStates = view.states.filter(({ track }) => track === "main");
  const branchStates = view.states.filter(({ track }) => track === "branch");

  return (
    <section
      className="guide-section lifecycle"
      aria-labelledby="lifecycle-title"
      data-current-lifecycle-state={view.current}
    >
      <header className="guide-section-heading">
        <div>
          <p className="guide-section-name">Lifecycle</p>
          <h2 id="lifecycle-title">A mutable record, never a fixed identity</h2>
        </div>
        <p>Only a guide-authored revision can become operative.</p>
      </header>

      <div
        className="lifecycle-chart"
        aria-label={`Current lifecycle state: ${titleCase(view.current)}`}
      >
        <ol className="lifecycle-track lifecycle-track--main" aria-label="Main lifecycle track">
          {mainStates.map((state) => {
            const current = state.id === view.current;
            return (
              <motion.li
                className={`lifecycle-state${current ? " lifecycle-state--current" : ""}`}
                key={state.id}
                data-lifecycle-track="main"
                data-state={state.id}
                aria-current={current ? "step" : undefined}
                style={{ "--lifecycle-tone": state.tone } as CSSProperties}
                layout
                transition={toMotionTransition(stateMotion)}
              >
                <span className="lifecycle-state-glyph" aria-hidden="true">
                  <Glyph name={stateGlyph(state.id)} size={18} />
                </span>
                <span>{titleCase(state.id)}</span>
                {current ? (
                  <motion.span
                    className="lifecycle-current-marker"
                    data-motion-kind={stateMotion.kind}
                    layoutId="interest-lab-lifecycle-current"
                    transition={toMotionTransition(stateMotion)}
                  >
                    Current
                  </motion.span>
                ) : null}
              </motion.li>
            );
          })}
        </ol>
        <ol
          className="lifecycle-track lifecycle-track--branch"
          aria-label="Alternative lifecycle branch"
        >
          {branchStates.map((state) => {
            const current = state.id === view.current;
            return (
              <motion.li
                className={`lifecycle-state${current ? " lifecycle-state--current" : ""}`}
                key={state.id}
                data-lifecycle-track="branch"
                data-state={state.id}
                aria-current={current ? "step" : undefined}
                style={{ "--lifecycle-tone": state.tone } as CSSProperties}
                layout
                transition={toMotionTransition(stateMotion)}
              >
                <span className="lifecycle-state-glyph" aria-hidden="true">
                  <Glyph name={stateGlyph(state.id)} size={18} />
                </span>
                <span>{titleCase(state.id)}</span>
              </motion.li>
            );
          })}
        </ol>
      </div>

      <section className="gate-checklist" aria-labelledby="gate-checklist-title">
        <header>
          <div>
            <h3 id="gate-checklist-title">Candidate gate</h3>
            <p>
              {view.gate.eligible
                ? "Every required family is present."
                : "Evidence is still missing."}
            </p>
          </div>
          <span className={`gate-outcome gate-outcome--${view.gate.eligible ? "met" : "open"}`}>
            {view.gate.eligible ? "Eligible for guide review" : "Keep exploring"}
          </span>
        </header>
        <ul>
          {view.gate.families.map((item, index) => {
            const motionSpec = resolveGuideMotion("gateCheck", reducedMotion, index);
            return (
              <motion.li
                key={item.family}
                data-gate-family={item.family}
                data-gate-present={String(item.present)}
                data-motion-kind={motionSpec.kind}
                initial={reducedMotion ? false : { opacity: 0.78, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={toMotionTransition(motionSpec)}
              >
                <span className="gate-family-glyph" aria-hidden="true">
                  <Glyph name={item.present ? STATE_GLYPHS.met : STATE_GLYPHS.gap} size={18} />
                </span>
                <span>{titleCase(item.family)}</span>
                <strong>{item.present ? "Present" : "Not yet present"}</strong>
              </motion.li>
            );
          })}
        </ul>
        {view.gate.missing.length > 0 ? (
          <ul className="gate-missing-list">
            {view.gate.missing.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}
      </section>

      {view.proposal ? (
        <aside
          className="lifecycle-proposal"
          data-proposal-operative={String(view.proposal.operative)}
        >
          <span className="proposal-mark" aria-hidden="true">
            <Glyph name={STATE_GLYPHS.contested} size={20} />
          </span>
          <div>
            <p className="proposal-status">Suggestion only · {view.proposal.proposedBy}</p>
            <h3>Consider {titleCase(view.proposal.toState)}</h3>
            <p>{view.proposal.note}</p>
          </div>
        </aside>
      ) : null}

      {view.proposal ? (
        <form
          className="guide-authoring"
          data-guide-authoring="true"
          onSubmit={(event) => {
            event.preventDefault();
            if (!onAuthorRevision) return;
            const formData = new FormData(event.currentTarget);
            const decision = String(formData.get("guide-decision") ?? "").trim();
            const rationale = String(formData.get("guide-rationale") ?? "").trim();
            if (decision.length === 0 || rationale.length === 0) return;
            onAuthorRevision({ decision, rationale });
          }}
        >
          <div>
            <h3>Author an operative revision</h3>
            <p>{view.authoring.note}</p>
          </div>
          <label>
            Guide decision
            <input name="guide-decision" defaultValue="accept the candidate proposal" required />
          </label>
          <label>
            Rationale
            <textarea
              name="guide-rationale"
              defaultValue="The gate is met and the competing explanations remain visible."
              rows={3}
              required
            />
          </label>
          <button type="submit" disabled={!onAuthorRevision}>
            Author operative revision
          </button>
          <p className="authoring-boundary">
            Synthetic preview: this action appends only to local in-memory state.
          </p>
        </form>
      ) : (
        <p className="guide-authoring-complete">
          No shadow suggestion is awaiting a guide decision.
        </p>
      )}

      <details className="legal-transitions">
        <summary>Inspect {view.legalTransitions.length} legal transitions</summary>
        <ul>
          {view.legalTransitions.map((transition) => (
            <li key={`${transition.from}:${transition.to}`}>
              {titleCase(transition.from)} <span aria-hidden="true">→</span>{" "}
              {titleCase(transition.to)}
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}
