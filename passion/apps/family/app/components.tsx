"use client";

// Presentational components for the family co-engagement surface. Functional-but-plain (the operator
// polishes later): grayscale-safe (never color alone — always a word or a shape carries meaning),
// WCAG 2.2 AA contrast, reduced-motion honored in CSS. No child- or family-facing label or score
// anywhere; the family preview shows ONLY what the guide has approved.
import type { JSX } from "react";
import type { Knob } from "@gt100k/family";
import { childInitials, type Child } from "./family-data.js";
import type { CoachingCard } from "./family-state.js";
import type { FamilyController } from "./useFamily.js";

const RISK_LABEL: Record<string, string> = {
  none: "Steady",
  watch: "Watch",
  elevated: "Needs your review",
};

const KNOB_LABEL: Record<Knob, string> = {
  up: "Dial up",
  steady: "Hold steady",
};

export function Brand(): JSX.Element {
  return (
    <div className="brand">
      <span className="brand__mark" aria-hidden="true">
        ⌂
      </span>
      <span className="brand__name">
        PassionLab <span className="brand__sub">Family co-engagement</span>
      </span>
    </div>
  );
}

export function ChildSwitcher({ ctrl }: { ctrl: FamilyController }): JSX.Element {
  return (
    <nav className="switcher" aria-label="Children">
      <ul className="switcher__list">
        {ctrl.children.map((child: Child) => {
          const s = ctrl.summaries.get(child.id);
          const active = child.id === ctrl.kid;
          return (
            <li key={child.id}>
              <button
                type="button"
                className={`childbtn${active ? " childbtn--active" : ""}`}
                aria-current={active ? "true" : undefined}
                onClick={() => ctrl.setKid(child.id)}
              >
                <span className="childbtn__avatar" aria-hidden="true">
                  {childInitials(child.name)}
                </span>
                <span className="childbtn__body">
                  <span className="childbtn__name">{child.name}</span>
                  <span className={`chip chip--risk-${s?.risk ?? "none"}`}>
                    {s?.escalate ? "⚑ " : ""}
                    {RISK_LABEL[s?.risk ?? "none"]}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function PostureCard({ ctrl }: { ctrl: FamilyController }): JSX.Element {
  const p = ctrl.read.posture;
  return (
    <section className="card posture" aria-labelledby="posture-title">
      <h3 id="posture-title" className="card__title">
        Warm-demanding coaching posture
      </h3>
      <dl className="posture__grid">
        <div className="posture__item">
          <dt>Autonomy support</dt>
          <dd className={`knob knob--${p.autonomySupport}`}>{KNOB_LABEL[p.autonomySupport]}</dd>
        </div>
        <div className="posture__item">
          <dt>Structure</dt>
          <dd className={`knob knob--${p.structure}`}>{KNOB_LABEL[p.structure]}</dd>
        </div>
        <div className="posture__item">
          <dt>Warmth</dt>
          <dd className="knob knob--const">Non-contingent (always)</dd>
        </div>
        <div className="posture__item">
          <dt>Decouple worth from outcome</dt>
          <dd className="knob knob--const">{p.decoupleWorthFromOutcome ? "Yes" : "Not needed now"}</dd>
        </div>
      </dl>
      <p className="posture__note">
        Warmth stays the same win or lose. These are offers, never mandates — the child keeps choosing
        the problem, the method, and the pace.
      </p>
    </section>
  );
}

export function EscalationBanner({ ctrl }: { ctrl: FamilyController }): JSX.Element | null {
  const { read } = ctrl;
  if (!read.escalateToHuman) return null;
  return (
    <section className="banner" role="note" aria-labelledby="escalation-title">
      <h3 id="escalation-title" className="banner__title">
        ⚑ Needs your review
      </h3>
      {read.pressureWatch.antecedents.length > 0 ? (
        <>
          <p className="banner__lead">What fired:</p>
          <ul className="banner__list">
            {read.pressureWatch.antecedents.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </>
      ) : null}
      {read.escalationReason ? <p className="banner__reason">{read.escalationReason}</p> : null}
    </section>
  );
}

export function ObservationsCard({ ctrl }: { ctrl: FamilyController }): JSX.Element | null {
  if (ctrl.observations.length === 0) return null;
  return (
    <section className="card obs" aria-labelledby="obs-title">
      <h3 id="obs-title" className="card__title">
        Guide observations
        <span className="chip chip--soft">Synthetic</span>
      </h3>
      <ul className="obs__list">
        {ctrl.observations.map((o) => (
          <li key={o}>{o}</li>
        ))}
      </ul>
      <p className="obs__note">
        Guide-entered notes, never inferred by software. No facial or emotion detection, ever.
      </p>
    </section>
  );
}

function CardRow({ card, ctrl }: { card: CoachingCard; ctrl: FamilyController }): JSX.Element {
  const approved = ctrl.isApproved(card);
  const isTop = card.id === ctrl.topId;
  return (
    <li className={`offer${approved ? " offer--approved" : ""}`}>
      <div className="offer__body">
        <span className="offer__kind">{card.kind === "ask" ? "Door-opening ask" : "Shared activity"}</span>
        <p className="offer__text">{card.text}</p>
      </div>
      <button
        type="button"
        className={`btn${approved ? " btn--done" : ""}${isTop && !approved ? " btn--primary" : ""}`}
        onClick={() => ctrl.approve(card)}
        disabled={approved}
        aria-pressed={approved}
      >
        {approved ? "✓ Approved for family" : "Approve for family"}
      </button>
    </li>
  );
}

export function CoachingList({ ctrl }: { ctrl: FamilyController }): JSX.Element {
  return (
    <section className="card" aria-labelledby="offers-title">
      <h3 id="offers-title" className="card__title">
        Coaching offers to approve
      </h3>
      <ul className="offers">
        {ctrl.cards.map((card) => (
          <CardRow key={card.id} card={card} ctrl={ctrl} />
        ))}
      </ul>
      <p className="card__foot">
        The system proposes; you dispose. An item appears for the family only after you approve it.
        Nothing is ever sent to a parent automatically.
      </p>
    </section>
  );
}

export function RationaleCard({ ctrl }: { ctrl: FamilyController }): JSX.Element {
  const { read } = ctrl;
  return (
    <section className="card rationale" aria-labelledby="rationale-title">
      <h3 id="rationale-title" className="card__title">
        Why
      </h3>
      <p className="rationale__text">{read.rationale}</p>
      {read.guardrailNotes.length > 0 ? (
        <ul className="rationale__notes">
          {read.guardrailNotes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

export function FamilyPreview({ ctrl }: { ctrl: FamilyController }): JSX.Element {
  const items = ctrl.familyPreview;
  return (
    <section className="preview" aria-labelledby="preview-title" data-approved={items.length}>
      <header className="preview__head">
        <h2 id="preview-title">Family-facing preview</h2>
        <span className="chip chip--soft">Approved only</span>
      </header>
      {items.length === 0 ? (
        <p className="preview__empty">
          Nothing here yet. Approve a coaching offer on the left and it will appear here for the family.
        </p>
      ) : (
        <ul className="preview__list">
          {items.map((card) => (
            <li key={card.id} className="preview__item">
              <span className="preview__kind">
                {card.kind === "ask" ? "An idea to try" : "Something to do together"}
              </span>
              <p className="preview__text">{card.text}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
