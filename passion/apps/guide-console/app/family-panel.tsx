"use client";

// The Family co-engagement tab (021): a read-only guide-facing coaching read for the selected child.
// Warm-demanding posture + door-opening offers + shared-activity ideas + any "needs your review"
// escalation + the synthetic guide observations + rationale. No approve/preview, no child/family-facing
// label, no score (019 guardrails). Dark-console styling, reusing the wbpanel/wbitem/plangrid patterns.
import type { JSX } from "react";
import type { FamilyRead } from "@gt100k/family";

const KNOB_LABEL: Record<string, string> = { up: "Dial up", steady: "Hold steady" };
const RISK_LABEL: Record<string, string> = {
  none: "Healthy",
  watch: "Watch",
  elevated: "Elevated pressure",
};

export function FamilyPanel({
  read,
  observations,
}: {
  read: FamilyRead | undefined;
  observations: readonly string[];
}): JSX.Element {
  return (
    <section className="wbpanel" aria-label="Family co-engagement" data-testid="family-panel">
      <header className="wbpanel__head">
        <span className="wbpanel__sub">The system proposes coaching, you decide.</span>
      </header>

      {!read ? (
        <p className="wbpanel__empty" role="status">
          No coaching read yet.
        </p>
      ) : (
        <ul className="wblist">
          {/* Escalation first, when the pressure watch needs a human. */}
          {read.escalateToHuman ? (
            <li className="wbitem wbitem--review" data-testid="family-review">
              <div className="wbitem__top">
                <span className="wbitem__spec">Needs your review</span>
                <span className="wbitem__state">{RISK_LABEL[read.pressureWatch.risk] ?? read.pressureWatch.risk}</span>
              </div>
              {read.pressureWatch.antecedents.length > 0 ? (
                <div className="planpcde">
                  {read.pressureWatch.antecedents.map((a) => (
                    <span key={a} className="chip chip--soft">
                      {a}
                    </span>
                  ))}
                </div>
              ) : null}
              <p className="wbitem__reason">{read.escalationReason ?? read.rationale}</p>
            </li>
          ) : null}

          {/* Warm-demanding coaching posture. */}
          <li className="wbitem">
            <div className="wbitem__top">
              <span className="wbitem__spec">Warm-demanding posture</span>
              {!read.escalateToHuman ? (
                <span className="wbitem__state">{RISK_LABEL[read.pressureWatch.risk] ?? read.pressureWatch.risk}</span>
              ) : null}
            </div>
            <dl className="plangrid">
              <div>
                <dt>Autonomy support</dt>
                <dd>{KNOB_LABEL[read.posture.autonomySupport] ?? read.posture.autonomySupport}</dd>
              </div>
              <div>
                <dt>Structure</dt>
                <dd>{KNOB_LABEL[read.posture.structure] ?? read.posture.structure}</dd>
              </div>
              <div>
                <dt>Warmth</dt>
                <dd>Non-contingent</dd>
              </div>
              <div>
                <dt>Decouple worth from outcome</dt>
                <dd>{read.posture.decoupleWorthFromOutcome ? "Yes" : "No"}</dd>
              </div>
            </dl>
            {observations.length > 0 ? (
              <div className="famobs">
                <span className="famobs__k">
                  Guide observations <span className="chip chip--soft">synthetic</span>
                </span>
                <ul className="famobs__list">
                  {observations.map((o) => (
                    <li key={o}>{o}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </li>

          {/* Coaching offers: door-opening asks + shared-activity ideas. */}
          {read.asks.length > 0 || read.sharedActivities.length > 0 ? (
            <li className="wbitem">
              <div className="wbitem__top">
                <span className="wbitem__spec">Coaching offers</span>
              </div>
              <ul className="famoffers">
                {read.asks.map((a) => (
                  <li key={a}>
                    <span className="famoffers__k">Door-opening ask</span>
                    {a}
                  </li>
                ))}
                {read.sharedActivities.map((s) => (
                  <li key={s}>
                    <span className="famoffers__k">Shared activity</span>
                    {s}
                  </li>
                ))}
              </ul>
              <p className="planproject__owns">
                Offers, not mandates — the child keeps choosing the problem, the method, and the pace.
              </p>
            </li>
          ) : null}

          {!read.escalateToHuman ? (
            <p className="wbitem__reason wbitem__reason--muted">{read.rationale}</p>
          ) : null}
        </ul>
      )}
    </section>
  );
}
