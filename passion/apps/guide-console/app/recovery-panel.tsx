"use client";

// The recovery panel: what a guide DOES once a burnout or fading signal is already flagged.
//
// It opens on demand from the wellbeing strip or the action line (see console.tsx), so it never
// competes with the strip for height — the strip stays the always-on summary, this is the step a
// guide takes when they decide to act. The moves are the point, so they are the loudest thing here;
// each carries a quiet "why?" resolving to the research behind it, and the two guardrails sit apart
// as things to avoid rather than as two more steps. No child-facing content, ever.
import { useState, type JSX } from "react";

import type { EvidenceGrade, RecoveryMove, RecoveryPlan } from "./recovery.js";
import { WhyThis } from "./why.js";

// Evidence strength in a teacher's words, told apart by text first and colour second, the same way
// BasisTag treats a claim's basis. Not "grade" on screen: a teacher reads how much to trust it.
const GRADE_LABEL: Record<EvidenceGrade, string> = {
  "controlled-in-children": "Tested with children",
  "correlational-or-older-sample": "From related or older-age studies",
  reasoned: "Our best reasoning",
};

function Move({ move }: { move: RecoveryMove }): JSX.Element {
  const avoid = move.kind === "DO_NOT";
  return (
    <li className={`recmove${avoid ? " recmove--avoid" : ""}`}>
      <span className="recmove__does">{move.does}</span>
      <span className="recmove__meta">
        <span className={`recmove__grade recmove__grade--${move.grade}`}>
          {GRADE_LABEL[move.grade]}
        </span>
        {move.claimIds.map((id) => (
          <WhyThis key={id} id={id} what="this step" />
        ))}
      </span>
    </li>
  );
}

export function RecoveryPanel({
  plan,
  onLog,
}: {
  readonly plan: RecoveryPlan;
  /** When present, the guide can record what they chose. Advisory only — see recovery-log.ts. */
  readonly onLog?: (note: string) => void;
}): JSX.Element {
  // The active moves lead; the guardrails ("what not to do") sit in their own group so a guide does
  // not read "Don't make the child quit" as the next thing to try.
  const active = plan.moves.filter((m) => m.kind !== "DO_NOT");
  const avoid = plan.moves.filter((m) => m.kind === "DO_NOT");
  const [draft, setDraft] = useState("");

  return (
    <div className="recovery">
      <h2 className="recovery__headline">{plan.headline}</h2>

      <ol className="recovery__moves">
        {active.map((m) => (
          <Move key={m.id} move={m} />
        ))}
      </ol>

      {plan.breakGuidance ? (
        <section className="recovery__break">
          <h3 className="recovery__subhd">How long a break?</h3>
          <p className="recovery__breakhd">
            {plan.breakGuidance.headline}
            {plan.breakGuidance.claimIds.map((id) => (
              <WhyThis key={id} id={id} what="the break length" />
            ))}
          </p>
          <p className="recovery__breakdetail">{plan.breakGuidance.detail}</p>
        </section>
      ) : null}

      <section className="recovery__pivot">
        <h3 className="recovery__subhd">
          {plan.pivotGuidance.headline}
          {plan.pivotGuidance.claimIds.map((id) => (
            <WhyThis key={id} id={id} what="this" />
          ))}
        </h3>
        <p className="recovery__pivotdetail">{plan.pivotGuidance.detail}</p>
      </section>

      {avoid.length > 0 ? (
        <section className="recovery__avoid" aria-label="What to avoid">
          <h3 className="recovery__subhd">What to avoid</h3>
          <ul className="recovery__moves recovery__moves--avoid">
            {avoid.map((m) => (
              <Move key={m.id} move={m} />
            ))}
          </ul>
        </section>
      ) : null}

      {onLog !== undefined ? (
        <form
          className="recovery__log"
          onSubmit={(e) => {
            e.preventDefault();
            const text = draft.trim();
            if (text !== "") {
              onLog(text);
              setDraft("");
            }
          }}
        >
          <label className="recovery__logk" htmlFor="recovery-note">
            Record what you chose
          </label>
          <input
            id="recovery-note"
            className="recovery__loginput"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="e.g. Started a 1-week step-away"
          />
          <button type="submit" className="recovery__logbtn">
            Save to this browser
          </button>
        </form>
      ) : null}
    </div>
  );
}
