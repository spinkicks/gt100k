"use client";

// The specialization Plan panel (018-D1 P7). For the selected child it renders, per CERTIFIED spike,
// the staged ascent plan: the stage + what it is for, the mentor role, the audience level, the next
// authentic project (driving question, method, craft scaffold + its VETTED curated resources as
// title→link, who it is for), the bounded practice dose + mandatory rest, the PCDE focus, and any
// "Needs your review" replan (rest / deload / stage-advance) with a plain rationale + the honest
// terminal note. Guide-facing only, grayscale-safe: NO child-facing text, NO reward/score/grade.
import type { JSX } from "react";
import type { PlanCardVM } from "./plan.js";
import { specPath, modeLabel } from "./vocab.js";
import { WhyThis } from "./why.js";

const STAGE_LABEL: Record<string, string> = {
  S1_IGNITION: "Ignition",
  S2_FOUNDATIONS: "Foundations",
  S3_AUTHORSHIP: "Authorship",
  S4_SIGNATURE: "Signature",
};
const STAGE_PURPOSE: Record<string, string> = {
  S1_IGNITION: "Fall in love and keep coming back.",
  S2_FOUNDATIONS: "Get precise without killing the fun.",
  S3_AUTHORSHIP: "Make it real for a community.",
  S4_SIGNATURE: "Find your voice: portfolio-defining work.",
};
const MENTOR_LABEL: Record<string, string> = {
  WARM: "Warm mentor",
  TECHNICAL: "Technical coach",
  DOMAIN_EXPERT: "Domain expert",
  MASTER: "Master",
};
const AUDIENCE_LABEL: Record<string, string> = {
  SELF: "Just for them (and family)",
  MENTOR_PEERS: "Mentor and peers",
  REAL_COMMUNITY: "A real community",
  FIELD: "The field",
};
const CADENCE_LABEL: Record<string, string> = {
  MANY_SHORT: "Many short playful projects",
  TERM_LENGTH: "A term-length project",
  MAJOR_TYPE_III: "A major real project",
  FLAGSHIP: "A flagship plus a body of work",
};
const PCDE_LABEL: Record<string, string> = {
  enjoyment: "Enjoyment",
  relatedness: "Relatedness",
  identity: "Identity spark",
  self_regulation: "Self-regulation",
  goal_setting: "Goal-setting",
  quality_practice: "Quality practice",
  planning: "Planning",
  self_evaluation: "Realistic self-evaluation",
  coping_feedback: "Coping with feedback",
  strategic_risk: "Strategic risk",
  self_advocacy: "Self-advocacy",
  self_direction: "Self-direction",
  resilience: "Resilience under stakes",
  networking: "Networking",
  producer_identity: "Producer identity",
};

function titleCase(s: string): string {
  return s.length === 0 ? s : s[0] + s.slice(1).toLowerCase();
}

/**
 * The craft-scaffold prose, ending where the link list takes over.
 *
 * The stub brief embeds the vetted resources into the sentence, raw URLs and all, and the same
 * resources then render as clean links directly below — so a guide read every title twice, once as
 * unclickable prose and once as a link. Stripping only the URLs left the duplication in place and
 * made it harder to spot, because what remained looked like ordinary prose.
 *
 * So the sentence is cut at its colon and the links finish it. Titles are matched and removed as a
 * fallback for a brief that lists them without a colon, since a real generator will not follow the
 * stub's punctuation.
 */
function scaffoldProse(text: string, titles: readonly string[]): string {
  const withoutUrls = text.replace(/\s*\(https?:\/\/[^)]+\)/g, "");
  const cut = withoutUrls.indexOf("resources:");
  let out = cut === -1 ? withoutUrls : withoutUrls.slice(0, cut + "resources:".length);
  if (cut === -1) for (const t of titles) out = out.split(t).join("");
  return out
    .replace(/\s{2,}/g, " ")
    .replace(/[;,]\s*\.?$/, "")
    .trim();
}

// The engine's rationale/escalation prose can contain raw stage tokens (e.g. "S1_IGNITION");
// render them with the friendly stage name so no enum leaks into the guide-facing copy.
function humanizeStages(text: string): string {
  return text
    .replace(/S1_IGNITION/g, "Ignition")
    .replace(/S2_FOUNDATIONS/g, "Foundations")
    .replace(/S3_AUTHORSHIP/g, "Authorship")
    .replace(/S4_SIGNATURE/g, "Signature");
}

function restLine(r: PlanCardVM["plan"]["restCadence"]): string {
  return `${r.daysOffPerWeek} days/week off, ${r.monthsOffPerYear} months/year off the primary spike (in ~${r.offInIncrementsOfMonths}-month breaks)`;
}

function doseLine(dose: number): string {
  const pct = Math.round(dose * 100);
  return pct === 0
    ? "Deliberate play (no formal practice yet)"
    : `${pct}% bounded, chosen practice`;
}

function PlanItem({ card }: { card: PlanCardVM }): JSX.Element {
  const p = card.plan;
  const project = p.nextProject;
  return (
    <li
      className={`wbitem${p.escalateToHuman ? " wbitem--review" : ""}`}
      data-testid="plan-item"
      data-stage={p.stage}
      data-cell={card.cellKey}
    >
      <div className="wbitem__top">
        <span className="wbitem__spec">
          {specPath(card.domainPath)} · {modeLabel(card.mode)}
        </span>
        <span className="wbitem__state">
          {STAGE_LABEL[p.stage] ?? p.stage} · {titleCase(card.state)}
        </span>
      </div>
      <p className="planitem__purpose">{STAGE_PURPOSE[p.stage] ?? ""}</p>

      <dl className="plangrid">
        <div>
          <dt>Mentor</dt>
          <dd>{MENTOR_LABEL[p.mentorRole] ?? p.mentorRole}</dd>
        </div>
        <div>
          <dt>Audience</dt>
          <dd>{AUDIENCE_LABEL[p.audience] ?? p.audience}</dd>
        </div>
        <div>
          <dt>Project rhythm</dt>
          <dd>{CADENCE_LABEL[p.cadence] ?? p.cadence}</dd>
        </div>
        <div>
          <dt>Practice dose</dt>
          <dd>{doseLine(p.dpDose)}</dd>
        </div>
        <div>
          <dt>Rest</dt>
          <dd>{restLine(p.restCadence)}</dd>
        </div>
      </dl>

      <div className="planproject">
        <span className="planproject__k">Next project</span>
        <p className="planproject__title">{project.title}</p>
        <p className="planproject__q">{project.drivingQuestion}</p>
        <p className="planproject__method">
          <strong>How:</strong> {project.authenticMethod}
        </p>
        <p className="planproject__scaffold">
          <strong>Craft scaffold:</strong>{" "}
          {scaffoldProse(
            project.craftScaffold,
            card.resources.map((r) => r.title),
          )}
        </p>
        {card.resources.length > 0 ? (
          <ul className="planres">
            {card.resources.map((r) => (
              <li key={r.id}>
                <a href={r.url} target="_blank" rel="noreferrer">
                  {r.title}
                </a>
              </li>
            ))}
          </ul>
        ) : null}
        <p className="planproject__success">
          <strong>Success looks like:</strong> {project.successLooksLike}
        </p>
        <p className="planproject__owns">The child owns the problem, the method, and the pace.</p>

        {/* INSIDE the project box, and labelled. These are `PCDE_BY_STAGE[stage]` — the psychosocial
            skills this stage of the plan is quietly building besides the craft. They used to sit
            below the box as four bare uppercase chips: the only unlabelled block on the tab, wearing
            the mark this console uses for taxonomy tags ON an object, which said they were something
            the child had earned or the guide had picked. They are neither. Four short nouns are one
            idea, so they read as a sentence rather than as four objects, and the claim behind them
            was already written and pointing at nothing. */}
        <div className="planpcde">
          <span className="planproject__k">
            <span className="why-head">
              What this stage builds in them
              <WhyThis id="psychosocial-skills" what="these skills are the bottleneck" />
            </span>
          </span>
          <p className="planpcde__list">{p.pcdeFocus.map((k) => PCDE_LABEL[k] ?? k).join(", ")}.</p>
        </div>
      </div>

      {p.escalateToHuman ? (
        <div className="wbitem__review" role="note">
          <span className="wbitem__reviewk">Needs your review</span>
          <p className="wbitem__reason">{humanizeStages(p.escalationReason ?? p.rationale)}</p>
        </div>
      ) : null}
    </li>
  );
}

export function PlanPanel({ cards }: { cards: readonly PlanCardVM[] }): JSX.Element {
  return (
    <section className="wbpanel" aria-label="Specialization plan" data-testid="plan-panel">
      <header className="wbpanel__head">
        <span className="wbpanel__sub">The system proposes a plan, you decide.</span>
      </header>

      {cards.length === 0 ? (
        // Singular, because the tab is scoped to one specialization and the banner above has just
        // named it. The old plural read as a claim about the whole child, which is a different and
        // wronger statement: the child may well have a planned spike sitting on the next rail row.
        <output className="wbpanel__empty">
          This one is not a certified spike yet, so there is no plan for it. A spike is planned once
          you promote it to a candidate or an active specialization.
        </output>
      ) : (
        <>
          <ul className="wblist" data-testid="plan-list">
            {cards.map((c) => (
              <PlanItem key={c.id} card={c} />
            ))}
          </ul>
          {cards[0] ? <p className="planterminal">{cards[0].plan.terminalNote}</p> : null}
        </>
      )}
    </section>
  );
}
