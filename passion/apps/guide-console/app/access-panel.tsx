"use client";

// The Access panel (023-access-broker D3 + D4). For the selected child, per certified spike, it shows
// the mentor role + audience level the plan named, the ranked broker matches, and the access-transfer
// lifecycle the guide drives: propose, then approve (guardian consent is a HARD blocker), then walk
// introduced -> active -> transferred. The system proposes; the guide disposes. Guide-facing only, no
// child-facing text, no score/rank.
import { useState, type JSX } from "react";
import {
  advanceHandoff,
  approve,
  declineMatch,
  proposeMatch,
  type AudienceChannel,
  type AudienceLevel,
  type Brokerage,
  type MentorRole,
  type MentorSourceLayer,
  type Match,
} from "@gt100k/access-broker";
import type { AccessCardVM } from "./access.js";
import { specPath, modeLabel } from "./vocab.js";

const GUIDE_ID = "guide-synthetic";
const now = (): string => new Date().toISOString();

const MENTOR_LABEL: Record<MentorRole, string> = {
  WARM: "Warm mentor",
  TECHNICAL: "Technical coach",
  DOMAIN_EXPERT: "Domain expert",
  MASTER: "Master",
};
const AUDIENCE_LABEL: Record<AudienceLevel, string> = {
  SELF: "Just for them (and family)",
  MENTOR_PEERS: "Mentor and peers",
  REAL_COMMUNITY: "A real community",
  FIELD: "The field",
};
const LAYER_LABEL: Record<MentorSourceLayer, string> = {
  AI: "AI",
  FAMILY: "Family",
  NEAR_PEER: "Near-peer",
  THIN_EXPERT: "Vetted expert",
  MASTER: "Master",
};
const CHANNEL_LABEL: Record<AudienceChannel, string> = {
  COMPETITION: "Competition",
  PUBLISHING: "Publishing",
  COMMUNITY: "Community",
  MARKETPLACE: "Marketplace",
};
/**
 * The broker's reasons, in a guide's words.
 *
 * The engine writes them for itself — "domain code-computers/game-dev::build", "fills WARM role",
 * "reputation 0.92" — and this console is read by mentors rather than engineers, so passing them
 * through raw would replace one unexplained number with four unexplained strings.
 *
 * Reputation becomes a phrase rather than a figure, deliberately. It is the input that decides the
 * ranking when everything else ties, and 0.92 versus 0.8 invites a precision the underlying number
 * does not have.
 */
/**
 * CHIPS, NOT A SENTENCE. This used to build "Why this one: it is in this exact area, it fills the
 * warm mentor role this plan asked for, and it is well regarded" -- 24 words, repeated on every
 * match row. With four matches on one screen that is the same sentence four times with a word
 * changed, and a guide scanning for the difference between two mentors had to read both in full to
 * find it. As chips the differences are the only thing that moves.
 */
function fitChips(fit: readonly string[]): readonly string[] {
  const said: string[] = [];
  for (const f of fit) {
    if (f.startsWith("domain ")) said.push("Right subject");
    else if (f.startsWith("mode ")) said.push("Suits how they work");
    else if (f.startsWith("fills ")) {
      const role = f.slice("fills ".length).replace(" role", "");
      said.push(MENTOR_LABEL[role as MentorRole] ?? role);
    } else if (f.endsWith(" source")) {
      // Dropped: the source layer is already the chip beside the title, and saying it twice in two
      // registers ("AI" and "the ai layer") is worse than saying it once.
    } else if (f.endsWith(" audience")) {
      said.push(`${f.slice(0, -" audience".length)} audience`);
    } else if (f.endsWith(" channel")) {
      const ch = f.slice(0, -" channel".length);
      said.push(CHANNEL_LABEL[ch as AudienceChannel] ?? ch);
    } else if (f.startsWith("reputation ")) {
      // A phrase rather than a figure, deliberately: reputation decides the ranking when everything
      // else ties, and 0.92 against 0.8 invites a precision the underlying number does not have.
      const n = Number(f.slice("reputation ".length));
      said.push(Number.isNaN(n) ? f : n >= 0.9 ? "Well regarded" : "Established");
    } else said.push(f);
  }
  return said;
}

const STATE_LABEL: Record<string, string> = {
  proposed: "Proposed",
  approved: "Approved",
  introduced: "Introduced",
  active: "Active",
  transferred: "Handed over",
  declined: "Declined",
};

function MatchRow({
  match,
  brokerage,
  consent,
  onPropose,
  onConsent,
  onApprove,
  onAdvance,
  onDecline,
}: {
  match: Match;
  brokerage: Brokerage | undefined;
  consent: boolean;
  onPropose: () => void;
  onConsent: (v: boolean) => void;
  onApprove: () => void;
  onAdvance: (next: Brokerage["state"]) => void;
  onDecline: () => void;
}): JSX.Element {
  const o = match.opportunity;
  const source =
    o.kind === "mentor"
      ? o.sourceLayer
        ? LAYER_LABEL[o.sourceLayer]
        : "Mentor"
      : o.channel
        ? CHANNEL_LABEL[o.channel]
        : "Audience";
  const state = brokerage?.state;
  const terminal = state === "transferred" || state === "declined";

  return (
    <li className="accmatch" data-testid="access-match">
      <div className="accmatch__head">
        <span className="accmatch__title">{o.title}</span>
        <span className="chip chip--soft">{source}</span>
      </div>
      {/* THE REASONS, NOT THE PERCENTAGE. This used to show "78% fit", which was the only number in
          the console with no explanation behind it and the one that decides which human meets a
          child. Its precision was also false: two mentors differing only in source reputation came
          out 78 and 76, so the panel showed a two-point spread where the real difference was one
          input, and named neither. `match.fit` already held the reasons and was being thrown away,
          and `.accmatch__fit` was already in the stylesheet with no component using it. */}
      {match.fit.length > 0 ? (
        <p className="accmatch__fit">
          {fitChips(match.fit).map((c) => (
            <span key={c} className="chip chip--soft">
              {c}
            </span>
          ))}
        </p>
      ) : null}
      {o.availability?.deadline ? (
        <p className="accmatch__meta">Deadline {o.availability.deadline}</p>
      ) : null}

      {match.blocked ? (
        <p className="accmatch__blocked" role="note">
          {match.blocked}
        </p>
      ) : !brokerage ? (
        <div className="accmatch__actions">
          <button type="button" className="btn btn--ghost" onClick={onPropose}>
            Propose handoff
          </button>
        </div>
      ) : (
        <div className="accmatch__lifecycle">
          <span className={`accstate accstate--${state}`}>{STATE_LABEL[state ?? ""] ?? state}</span>
          {state === "proposed" ? (
            <>
              <label className="accconsent">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => onConsent(e.target.checked)}
                />
                Guardian consent recorded
              </label>
              <button
                type="button"
                className="btn btn--primary"
                disabled={!consent}
                onClick={onApprove}
              >
                Approve
              </button>
            </>
          ) : null}
          {state === "approved" ? (
            <button type="button" className="btn" onClick={() => onAdvance("introduced")}>
              Introduce
            </button>
          ) : null}
          {state === "introduced" ? (
            <button type="button" className="btn" onClick={() => onAdvance("active")}>
              Mark active
            </button>
          ) : null}
          {state === "active" ? (
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => onAdvance("transferred")}
            >
              Mark handed over
            </button>
          ) : null}
          {!terminal ? (
            <button type="button" className="btn btn--ghost" onClick={onDecline}>
              Decline
            </button>
          ) : null}
        </div>
      )}
    </li>
  );
}

function AccessSpike({ card }: { card: AccessCardVM }): JSX.Element {
  const { brokerPlan } = card;
  const [brokerages, setBrokerages] = useState<Record<string, Brokerage>>({});
  const [consent, setConsent] = useState<Record<string, boolean>>({});

  const spike = { kidId: brokerPlan.kidId, cellKey: card.cellKey };
  const setB = (id: string, b: Brokerage): void => setBrokerages((m) => ({ ...m, [id]: b }));

  function handlers(match: Match): {
    onPropose: () => void;
    onConsent: (v: boolean) => void;
    onApprove: () => void;
    onAdvance: (next: Brokerage["state"]) => void;
    onDecline: () => void;
  } {
    const id = match.opportunity.id;
    return {
      onPropose: () => setB(id, proposeMatch(match, spike, now())),
      onConsent: (v) => setConsent((m) => ({ ...m, [id]: v })),
      onApprove: () => {
        const b = brokerages[id];
        if (!b) return;
        try {
          setB(id, approve(b, { guardianConsent: true, guideId: GUIDE_ID }, now()));
        } catch {
          /* consent guard also enforced by the disabled button */
        }
      },
      onAdvance: (next) => {
        const b = brokerages[id];
        if (b) setB(id, advanceHandoff(b, next, now()));
      },
      onDecline: () => {
        const b = brokerages[id];
        if (b) setB(id, declineMatch(b, now()));
      },
    };
  }

  const renderMatch = (match: Match): JSX.Element => (
    <MatchRow
      key={match.opportunity.id}
      match={match}
      brokerage={brokerages[match.opportunity.id]}
      consent={consent[match.opportunity.id] ?? false}
      {...handlers(match)}
    />
  );

  return (
    <li className="wbitem" data-testid="access-item" data-cell={card.cellKey}>
      <div className="wbitem__top">
        <span className="wbitem__spec">
          {specPath(card.domainPath)} · {modeLabel(card.mode)}
        </span>
        <span className="wbitem__state">{card.state === "ACTIVE" ? "Active" : "Candidate"}</span>
      </div>

      <dl className="plangrid">
        <div>
          <dt>Mentor</dt>
          <dd>{MENTOR_LABEL[card.mentorRole]}</dd>
        </div>
        <div>
          <dt>Who sees it</dt>
          <dd>{AUDIENCE_LABEL[card.audience]}</dd>
        </div>
      </dl>

      {brokerPlan.held ? (
        <div className="wbitem__review" role="note">
          <span className="wbitem__reviewk">Holding new access</span>
          <p className="wbitem__reason">On a rest break, so no new audiences right now.</p>
        </div>
      ) : (
        <>
          <div className="accgroup">
            <span className="accgroup__k">Mentor options</span>
            {brokerPlan.mentorMatches.length > 0 ? (
              <ul className="acclist">{brokerPlan.mentorMatches.map(renderMatch)}</ul>
            ) : (
              <p className="accgroup__empty">No matching mentor in the catalog yet.</p>
            )}
          </div>

          <div className="accgroup">
            <span className="accgroup__k">Audience options</span>
            {card.audience === "SELF" ? (
              <p className="accgroup__empty">
                Just for them for now. No outside audience at this stage.
              </p>
            ) : brokerPlan.audienceMatches.length > 0 ? (
              <ul className="acclist">{brokerPlan.audienceMatches.map(renderMatch)}</ul>
            ) : (
              <p className="accgroup__empty">
                {brokerPlan.reasons.find((r) => r.toLowerCase().includes("craft")) ??
                  "No matching audience in the catalog yet."}
              </p>
            )}
          </div>
        </>
      )}
    </li>
  );
}

export function AccessPanel({ cards }: { cards: readonly AccessCardVM[] }): JSX.Element {
  return (
    <section className="wbpanel" aria-label="Access and audience broker" data-testid="access-panel">
      <header className="wbpanel__head">
        <span className="wbpanel__sub">
          The system suggests real mentors and audiences. You approve every connection.
        </span>
      </header>

      {cards.length === 0 ? (
        // Scoped to one specialization, so this speaks about that one. Read as a whole-child claim
        // it would be actively misleading here: "no mentor options for this kid" is the sort of
        // thing a guide acts on, and it may be false one rail row away.
        <output className="wbpanel__empty">
          No mentors or audiences yet. Promote this interest first.
        </output>
      ) : (
        <ul className="wblist" data-testid="access-list">
          {cards.map((c) => (
            <AccessSpike key={c.id} card={c} />
          ))}
        </ul>
      )}
    </section>
  );
}
