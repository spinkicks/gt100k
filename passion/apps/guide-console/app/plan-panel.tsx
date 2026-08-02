"use client";

// The specialization Plan panel (018-D1 P7). For the selected child it renders, per CERTIFIED spike,
// the staged ascent plan: the stage + what it is for, the mentor role, the audience level, the next
// authentic project (driving question, method, craft scaffold + its VETTED curated resources as
// title→link, who it is for), the bounded practice dose + mandatory rest, the PCDE focus, and any
// "Needs your review" replan (rest / deload / stage-advance) with a plain rationale + the honest
// terminal note. Guide-facing only, grayscale-safe: NO child-facing text, NO reward/score/grade.
import type { JSX } from "react";
import { Look } from "./look.js";
import type { PlanCardVM } from "./plan.js";
import type { CuratedResource } from "@gt100k/specialization-planner";
import type { HypothesisCard } from "@gt100k/hypothesis-store";
import { specPath, modeLabel } from "./vocab.js";
import { WhyThis } from "./why.js";
import { milestoneForPlan, type PlanMilestoneVM } from "./plan-milestone.js";

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
  return `${r.daysOffPerWeek} days a week off, and ${r.monthsOffPerYear} months a year away from it, in blocks of about ${r.offInIncrementsOfMonths} month${r.offInIncrementsOfMonths === 1 ? "" : "s"}`;
}

function doseLine(dose: number): string {
  const pct = Math.round(dose * 100);
  return pct === 0
    ? "Deliberate play (no formal practice yet)"
    : `${pct}% bounded, chosen practice`;
}

/**
 * The rung this child is on, in the domain's own words.
 *
 * This is the block that replaces filler with fact. Where the project brief says "Play with Game
 * Dev", this says "Write a solution someone else can follow" — because it comes from a map somebody
 * authored against a published curriculum rather than from a template with the domain name in it.
 */
function Rung({ ms }: { ms: PlanMilestoneVM }): JSX.Element {
  return (
    <div className="planrung">
      <span className="planproject__k">Their next step</span>
      <p className="planrung__title">{ms.title}</p>
      <p className="planrung__cap">{ms.capability}</p>

      {/* The basis, in the open. A guide is entitled to know whether the order of these rungs rests
          on a published curriculum or on our own reasoning, and `model` means nobody vouches for it
          but us. Hiding that would make an authored map and a guessed one look identical. */}
      <p className="planrung__why">
        <span className={`chip chip--basis chip--basis-${ms.basis}`}>{BASIS_LABEL[ms.basis]}</span>{" "}
        {ms.why}
      </p>
      {ms.limit === null ? null : <p className="planrung__limit">{ms.limit}</p>}

      {ms.practice.length > 0 ? (
        <>
          <span className="planproject__k">What practice looks like here</span>
          <ul className="planres planres--plain">
            {ms.practice.map((pr) => (
              <li key={pr.title}>
                <strong>{pr.title}.</strong> {pr.description}
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <p className="planrung__demo">
        <strong>Shows it:</strong> {ms.demonstration}
      </p>
      {ms.opportunity === null ? null : (
        <p className="planrung__opp">
          <strong>Out in the world:</strong> {ms.opportunity}
        </p>
      )}

      {/* Standing, and never without the work under it. Same rule the Maps tab holds to, for the
          same reason: Butler (1988) found a bare verdict with no task anchoring behaves like a
          grade and depressed interest in 132 children aged roughly 10 to 12. */}
      <p className="planrung__strength">{ms.strengthText}</p>
      {ms.evidence.length === 0 ? null : (
        <ul className="planres planres--plain">
          {ms.evidence.flatMap((e) =>
            e.made.map((m) => (
              <li key={`${e.projectId}-${m.title}`}>
                {m.title}
                <Look url={m.url} />
              </li>
            )),
          )}
        </ul>
      )}
    </div>
  );
}

/**
 * What a guide sees where nobody has written a map for this domain.
 *
 * Said plainly rather than filled in. Four maps exist against a catalogue of dozens of pursuits, so
 * this is the ordinary case, and a generated sentence about "playing with" the domain is exactly
 * the filler this whole change removes. An empty answer that names why it is empty is worth more
 * than a full one that means nothing.
 */
function NoMap({ resources }: { resources: readonly CuratedResource[] }): JSX.Element {
  return (
    <div className="planrung planrung--none">
      <span className="planproject__k">Their next step</span>
      <p className="planrung__cap">No roadmap for this subject yet.</p>
      {resources.length === 0 ? null : (
        <>
          <span className="planproject__k">Vetted material to work from</span>
          <ul className="planres">
            {resources.map((r) => (
              <li key={r.id}>
                <a href={r.url} target="_blank" rel="noreferrer">
                  {r.title}
                </a>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

/** What an ordering rests on, in a guide's words rather than the engine's. */
const BASIS_LABEL: Record<string, string> = {
  syllabus: "Published curriculum",
  research: "Research",
  community: "Community practice",
  model: "Our own reasoning",
};

/**
 * What a guide sees for a specialization that has no plan yet, which is most of them most of the
 * time.
 *
 * NOT A PLAN, AND IT MUST NOT LOOK LIKE ONE. An exploring child does not have a specialization plan
 * and inventing a screen that resembles one would be the filler problem in a new place. What this
 * shows is the road to one: the three gate checks, which are cleared, and the single next thing to
 * offer. Every field is already computed by the hypothesis store and was being read by exactly one
 * tab.
 *
 * The checks are deliberately shown as what they ARE rather than as a count. "Two of three" invites
 * reading a child as two-thirds of the way to something, which is the progress measure this product
 * refuses everywhere else.
 */
function RoadToAPlan({ card }: { card?: HypothesisCard }): JSX.Element {
  if (card === undefined) {
    return <output className="wbpanel__empty">Nothing tracked yet.</output>;
  }

  const gate = card.gate;
  const checks: readonly { readonly k: string; readonly label: string; readonly done: boolean }[] =
    [
      { k: "gap", label: "Came back after a long quiet gap", done: gate?.gapSurvived === true },
      {
        k: "durable",
        label: "Came back across several different days",
        done: gate?.durable === true,
      },
      { k: "artefact", label: "Made something", done: gate?.hasArtifact === true },
    ];

  return (
    <div className="roadmap" data-testid="road-to-a-plan">
      <p className="roadmap__lede">
        No plan yet. A plan starts once you have confirmed the interest. Here is what that takes.
      </p>

      <span className="planproject__k">What it takes</span>
      <ul className="roadmap__checks">
        {checks.map((c) => (
          <li key={c.k} data-done={c.done}>
            {/* The word, not only the mark. A tick and a dash differing by shape alone is the same
                colour-only failure the tab dot had, and this list is read at a glance. */}
            <span className="roadmap__mark" aria-hidden="true">
              {c.done ? "✓" : "–"}
            </span>
            {c.label}
            <span className="roadmap__state">{c.done ? "yes" : "not yet"}</span>
          </li>
        ))}
      </ul>

      <span className="planproject__k">What to offer next</span>
      <p className="roadmap__probe">{card.nextProbe}</p>

      <p className="planproject__owns">You decide when it is ready.</p>
    </div>
  );
}

function PlanItem({ card, kidId }: { card: PlanCardVM; kidId: string }): JSX.Element {
  const p = card.plan;
  const project = p.nextProject;
  const milestone = milestoneForPlan(kidId, card);
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

      {/* THE RUNG COMES FIRST, because it is the only part of this panel that knows anything about
          the domain. Everything above is pace, which the planner computes without knowing whether
          this child is learning chess or audio production; everything below is a project brief
          templated from the stage with the domain name substituted in. A guide who reads only one
          block should read this one. */}
      {milestone === null ? <NoMap resources={card.resources} /> : <Rung ms={milestone} />}

      {/* COLLAPSED WHENEVER A RUNG IS SHOWING, and this is a judgement worth recording. Side by side
          the two blocks make the argument on their own: the rung says "Make a bug happen on purpose,
          reproduce it on demand and publish the fix with a note on the cause", and the project below
          says "Play with Game Dev. Run lots of short, playful build experiments." The second is the
          stub generator's per-stage template with the domain name in it, and next to real domain
          knowledge it does not read as a lesser answer, it reads as noise.
          It is kept rather than deleted because `planner-live` will fill it with a brief grounded on
          the rung above, at which point it stops being a template and should open by default. Until
          then it is behind a summary that says what it is. */}
      <details className="planproject">
        <summary className="planproject__summary">
          <span className="planproject__k">A general project shape for this stage</span>
        </summary>
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
      </details>

      {p.escalateToHuman ? (
        <div className="wbitem__review" role="note">
          <span className="wbitem__reviewk">Needs your review</span>
          <p className="wbitem__reason">{humanizeStages(p.escalationReason ?? p.rationale)}</p>
        </div>
      ) : null}
    </li>
  );
}

export function PlanPanel({
  cards,
  kidId,
  exploring,
}: {
  cards: readonly PlanCardVM[];
  kidId: string;
  /** The specialization the tab is scoped to, needed only when it has no plan yet. */
  exploring?: HypothesisCard;
}): JSX.Element {
  return (
    <section className="wbpanel" aria-label="Specialization plan" data-testid="plan-panel">
      {cards.length === 0 ? (
        // A third of the workflow used to live here as one sentence. "Not a certified spike yet, so
        // there is no plan" is true and useless: most children are exploring most of the time, so
        // for most of a guide's session this tab said nothing. It now shows the ROAD to a plan --
        // which gate checks are cleared, what is missing, and what to offer next -- all of which the
        // engine already computes and only the Hypotheses tab was reading.
        <RoadToAPlan card={exploring} />
      ) : (
        <>
          <ul className="wblist" data-testid="plan-list">
            {cards.map((c) => (
              <PlanItem key={c.id} card={c} kidId={kidId} />
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
