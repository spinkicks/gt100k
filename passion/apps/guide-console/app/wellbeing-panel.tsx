"use client";

// The wellbeing / escalation panel (016-wellbeing P4). For the selected child it shows, per spike:
// the read state, the two recommended moves (challenge × pressure), and — when strain shows — a
// "Needs your review" note the guide DISPOSES. Guide-facing only, grayscale-safe, no child-facing
// label/score. The system proposes; the human decides.
import type { JSX } from "react";
import type { WellbeingCardVM } from "./wellbeing.js";
import { specPath } from "./vocab.js";

const STATE_LABEL: Record<string, string> = {
  UNDER_CHALLENGED: "Under-challenged",
  IN_ZONE: "In the zone",
  OVER_CHALLENGED: "Over-challenged",
  DANGER_WINDOW: "Danger window",
  EARLY_BURNOUT: "Early exhaustion signs",
  BURNOUT_TIP: "Possible tip into burnout",
  GAP: "Quiet period",
};
const CHALLENGE_LABEL: Record<string, string> = { PUSH: "Push", HOLD: "Hold", SCAFFOLD: "Scaffold" };
const PRESSURE_LABEL: Record<string, string> = { AUTONOMY_UP: "Autonomy ↑", STEADY: "Steady" };

export function WellbeingPanel({ cards }: { cards: readonly WellbeingCardVM[] }): JSX.Element {
  const escalations = cards.filter((c) => c.read.escalateToHuman).length;
  return (
    <section className="wbpanel" aria-labelledby="wb-title">
      <header className="wbpanel__head">
        <h2 id="wb-title">Wellbeing</h2>
        <span className="chip chip--soft">System proposes &middot; you decide</span>
        {escalations > 0 ? (
          <span className="chip wbpanel__count" data-testid="wb-escalations">
            {escalations} need your review
          </span>
        ) : null}
      </header>

      {cards.length === 0 ? (
        <p className="wbpanel__empty" role="status">
          No spikes to review yet.
        </p>
      ) : (
        <ul className="wblist">
          {cards.map((c) => (
            <li
              key={c.id}
              className={`wbitem${c.read.escalateToHuman ? " wbitem--review" : ""}`}
              data-state={c.read.state}
            >
              <div className="wbitem__top">
                <span className="wbitem__spec">{specPath(c.domainPath)}</span>
                <span className="wbitem__state">{STATE_LABEL[c.read.state] ?? c.read.state}</span>
              </div>
              <div className="wbitem__moves">
                <span>
                  Challenge: <strong>{CHALLENGE_LABEL[c.read.challenge] ?? c.read.challenge}</strong>
                </span>
                <span className="wbitem__sep" aria-hidden="true">
                  &middot;
                </span>
                <span>
                  Pressure: <strong>{PRESSURE_LABEL[c.read.pressure] ?? c.read.pressure}</strong>
                </span>
              </div>
              {c.read.escalateToHuman ? (
                <div className="wbitem__review" role="note">
                  <span className="wbitem__reviewk">Needs your review</span>
                  <p className="wbitem__reason">{c.read.escalationReason ?? c.read.rationale}</p>
                </div>
              ) : (
                <p className="wbitem__reason wbitem__reason--muted">{c.read.rationale}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
