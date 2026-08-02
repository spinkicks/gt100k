"use client";

// The Family co-engagement tab (021): a read-only guide-facing coaching read for the selected child.
// Warm-demanding posture + door-opening offers + shared-activity ideas + any "needs your review"
// escalation + the synthetic guide observations + rationale. No approve/preview, no child/family-facing
// label, no score (019 guardrails). Dark-console styling, reusing the wbpanel/wbitem/plangrid patterns.
import type { JSX } from "react";
import type { GuideDecision } from "./decisions.js";
import type { HypothesisCard } from "@gt100k/hypothesis-store";
import { CoachingLog, MadeHistory } from "./family-history.js";
import { FindOutPanel } from "./find-out-panel.js";
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
  kidId,
  domainPath,
  decisions,
  cards,
}: {
  read: FamilyRead | undefined;
  observations: readonly string[];
  kidId: string;
  /** The selected specialization, so the domain-specific moves match what is on screen. */
  domainPath?: readonly string[];
  decisions: readonly GuideDecision[];
  cards: readonly HypothesisCard[];
}): JSX.Element {
  return (
    <section className="wbpanel" aria-label="Family co-engagement" data-testid="family-panel">
      {!read ? (
        <output className="wbpanel__empty">No coaching read yet.</output>
      ) : (
        <ul className="wblist">
          {/* Escalation first, when the pressure watch needs a human. */}
          {read.escalateToHuman ? (
            <li className="wbitem wbitem--review" data-testid="family-review">
              <div className="wbitem__top">
                <span className="wbitem__spec">Needs your review</span>
                <span className="wbitem__state">
                  {RISK_LABEL[read.pressureWatch.risk] ?? read.pressureWatch.risk}
                </span>
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
              <span className="wbitem__spec">How to be with them right now</span>
              {!read.escalateToHuman ? (
                <span className="wbitem__state">
                  {RISK_LABEL[read.pressureWatch.risk] ?? read.pressureWatch.risk}
                </span>
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
                <dd>Not tied to how the work goes</dd>
              </div>
              <div>
                {/* Phrased as a move, like every other value in this list, because the raw boolean
                    read backwards to the audience it is for. `decoupleWorthFromOutcome` is true
                    when stakes or pressure are present and this family needs active coaching to
                    separate the child's worth from their results; false is the healthy baseline. So
                    a healthy family rendered as "Decouple worth from outcome: No", four inches from
                    a Healthy badge, and any plain reader takes that for a failing. */}
                <dt>Separate worth from outcome</dt>
                <dd>
                  {read.posture.decoupleWorthFromOutcome
                    ? "Coach this now"
                    : "Not needed right now"}
                </dd>
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
              {/* Two groups with one heading each, rather than one interleaved list repeating its
                  eyebrow above every item. Five uppercase keys for five one-line items meant the
                  labels took as much vertical space as the content and the block read as ten rows.
                  `read.asks` and `read.sharedActivities` were already separate arrays; only the
                  rendering merged them. */}
              {read.asks.length > 0 ? (
                <div className="famgroup">
                  <span className="famoffers__k">Doors you can open</span>
                  <ul className="famoffers">
                    {read.asks.map((a) => (
                      <li key={a}>{a}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {read.sharedActivities.length > 0 ? (
                <div className="famgroup">
                  <span className="famoffers__k">Shared activities</span>
                  <ul className="famoffers">
                    {read.sharedActivities.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </li>
          ) : null}
        </ul>
      )}

      {/* WHAT HAPPENED, under what to do. Advice with no history behind it is a conversation about
          the engine's current opinion, which is the least useful thing to bring a parent. Neither
          list is generated: the decisions are the guide's own, the artefacts are the child's. */}
      {/* WHAT TO FIND OUT, beside what to offer next. Placed in Family because both are about a
          conversation with a person rather than a change to a plan, and because the moves this
          surface recommends are aimed at the adults in the room. */}
      <FindOutPanel domainPath={domainPath} />

      <div className="fhistwrap">
        <div>
          <span className="planproject__k">What you decided</span>
          <CoachingLog decisions={decisions} cards={cards} />
        </div>
        <div>
          <span className="planproject__k">What they made</span>
          <MadeHistory kidId={kidId} />
        </div>
      </div>
    </section>
  );
}
