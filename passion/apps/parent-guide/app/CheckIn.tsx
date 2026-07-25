"use client";

import { useState } from "react";
import { decide, type Decision, type Signals } from "./lib/decide.js";
import { QUESTIONS, BRANCH_COPY, SECOND_DOOR_NOTE, postureLine } from "./lib/copy.js";

const EMPTY: Signals = {
  anyStakesEvent: false,
  anyDevaluation: false,
  anyBackOffOrRest: false,
  pressuredSpecialization: false,
  overIdentification: false,
  parentalOverValuation: false,
  conditionalRegardObserved: false,
  familyControlObserved: false,
  lowFamilyEngagement: false,
};

export function CheckIn(): JSX.Element {
  const [signals, setSignals] = useState<Signals>(EMPTY);
  const [result, setResult] = useState<Decision | null>(null);

  const toggle = (key: keyof Signals) =>
    setSignals((prev) => ({ ...prev, [key]: !prev[key] }));

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setResult(decide(signals));
  };

  const onClear = () => {
    setSignals(EMPTY);
    setResult(null);
  };

  return (
    <>
      <p className="checkin__intro">
        A short, private self-reflection about right now. It runs entirely in your browser, it
        never stores or sends anything, and it never shows a score, a label, or a verdict. It
        offers what tends to help. It is guidance, not a diagnosis.
      </p>

      <form className="checkin" onSubmit={onSubmit}>
        <fieldset className="fieldset">
          <legend className="checkin__legend">Check any that feel true right now. Leave the rest.</legend>
          {QUESTIONS.map((q) => (
            <label className="toggle" key={q.signal}>
              <input
                type="checkbox"
                checked={signals[q.signal]}
                onChange={() => toggle(q.signal)}
              />
              <span>{q.label}</span>
            </label>
          ))}
        </fieldset>

        <div className="checkin__actions">
          <button type="submit" className="btn">
            Show me what tends to help
          </button>
          {result !== null && (
            <button type="button" className="btn btn--ghost" onClick={onClear}>
              Start over
            </button>
          )}
        </div>
      </form>

      {/* biome-ignore lint/a11y/useSemanticElements: this live region wraps <Result>, which renders a
          heading and paragraphs, and <output> only accepts phrasing content. */}
      <div role="status" aria-live="polite">
        {result !== null && <Result result={result} />}
      </div>
    </>
  );
}

function Result({ result }: { result: Decision }): JSX.Element {
  const copy = BRANCH_COPY[result.branch];
  const showSecondDoor = result.offers.includes("second_door");

  return (
    <div
      className="result"
      data-branch={result.branch}
      data-risk={result.risk}
      data-escalate={String(result.escalate)}
      data-autonomy={result.autonomySupport}
      data-structure={result.structure}
      data-decouple={String(result.decouple)}
      data-tone={result.talkToHuman ? "warn" : "calm"}
    >
      <h3>{copy.heading}</h3>
      <p>
        {copy.body}
        {showSecondDoor ? ` ${SECOND_DOOR_NOTE}` : ""}
      </p>
      {result.talkToHuman && (
        <p className="result__human">
          If this is ongoing or there is real distress, bring in your guide or a trusted
          professional. This page never replaces a person.
        </p>
      )}
      <p className="result__posture">
        {postureLine(result.autonomySupport, result.structure, result.decouple)}
      </p>
    </div>
  );
}
