"use client";

// The Project Studio surface: the kid's own projects (left), and the open project's quest, its big
// question, a quest-entry composer, and the journey log (newest first) with a Showtime showcase.
// Encouraging and theme-able; celebrates trying, iterating, and making. NO score, rank, or streak.
import { useMemo, useState, type CSSProperties, type JSX } from "react";
import {
  hasPerseverance,
  type Project,
  type WorkEvent,
  type WorkEventKind,
} from "@gt100k/project-workspace";
import { useStudio } from "./useStudio.js";
import { Mascot } from "./mascot.js";
import { ThemeSwitcher } from "./theme-switcher.js";
import { KindIcon, SparkIcon } from "./icons.js";
import { ENTRY_KINDS, audienceLabel, entryFor } from "./studio-state.js";

export function Studio(): JSX.Element {
  const ctrl = useStudio();
  const [showcase, setShowcase] = useState(false);

  return (
    <>
      <div className="shapes" aria-hidden="true">
        <span className="shape shape--circle" />
        <span className="shape shape--square" />
        <span className="shape shape--tri" />
        <span className="shape shape--diamond" />
        <span className="shape shape--hex" />
        <span className="shape shape--pill" />
      </div>

      <div className="techfx" aria-hidden="true">
        <span className="fx fx--code fx--c1">$ studio dev --watch</span>
        <span className="fx fx--code fx--c2">while (stuck) &#123; tryAgain(); &#125;</span>
        <span className="fx fx--code fx--c3">&#10003; compiled quest in 0.4s</span>
        <span className="fx fx--code fx--c4">&lt;Project status=&quot;making&quot; /&gt;</span>
        <span className="fx fx--code fx--c5">0100 1011 0110 1001</span>
        <span className="fx fx--code fx--c6">git commit -m &quot;made it&quot;</span>
        <span className="fx fx--glow fx--glow1" />
        <span className="fx fx--glow fx--glow2" />
        <span className="fx fx--sun" />
        <span className="fx fx--grid" />
      </div>

      <div className="app">
        <header className="topbar">
          <Mascot size={52} />
          <div className="brand">
            <div>
              <h1 className="brand__title">My Project Studio</h1>
              <span className="brand__sub">Where your ideas become real things</span>
            </div>
          </div>
          <div className="topbar__spacer" />
          <ThemeSwitcher />
        </header>

        <div className="layout">
          <ProjectList ctrl={ctrl} />
          {ctrl.openProject ? (
            <Quest ctrl={ctrl} onShowcase={() => setShowcase(true)} />
          ) : (
            <p className="log__empty">Pick a project to start your quest!</p>
          )}
        </div>
      </div>

      {showcase && ctrl.openProject ? (
        <Showcase project={ctrl.openProject} onClose={() => setShowcase(false)} />
      ) : null}
    </>
  );
}

function ProjectList({ ctrl }: { ctrl: ReturnType<typeof useStudio> }): JSX.Element {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [question, setQuestion] = useState("");
  const [method, setMethod] = useState("");

  function create(): void {
    ctrl.startSelfProject({ title, drivingQuestion: question, authenticMethod: method });
    setTitle("");
    setQuestion("");
    setMethod("");
    setAdding(false);
  }

  return (
    <nav className="projlist" aria-label="Your projects">
      <div className="projlist__label">Your projects</div>
      {ctrl.projects.map((p) => (
        <button
          key={p.id}
          type="button"
          className={`projcard${p.id === ctrl.openId ? " projcard--on" : ""}`}
          aria-pressed={p.id === ctrl.openId}
          onClick={() => ctrl.setOpenId(p.id)}
        >
          <div className="projcard__title">{p.title}</div>
          <div className="projcard__meta">
            {p.events.length} {p.events.length === 1 ? "entry" : "entries"} ·{" "}
            {p.source === "self" ? "your idea" : "a quest"}
          </div>
        </button>
      ))}

      {adding ? (
        <div className="newform">
          <input
            className="composer__in"
            placeholder="Project name"
            aria-label="Project name"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            className="composer__in"
            placeholder="Your big question"
            aria-label="Your big question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <input
            className="composer__in"
            placeholder="How you'll try it"
            aria-label="How you'll try it"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
          />
          <button type="button" className="btn btn--new btn--block" onClick={create}>
            Start it!
          </button>
        </div>
      ) : (
        <button type="button" className="btn btn--new" onClick={() => setAdding(true)}>
          + New project
        </button>
      )}
    </nav>
  );
}

function Quest({
  ctrl,
  onShowcase,
}: {
  ctrl: ReturnType<typeof useStudio>;
  onShowcase: () => void;
}): JSX.Element {
  const project = ctrl.openProject!;
  const [kind, setKind] = useState<WorkEventKind>("attempt");
  const [text, setText] = useState("");
  const [stuck, setStuck] = useState(false);
  const persevered = useMemo(() => hasPerseverance(project), [project]);
  const entries = useMemo(() => [...project.events].reverse(), [project.events]);

  function submit(): void {
    ctrl.addEntry(kind, text, kind === "outcome" ? { stuck } : {});
    setText("");
    setStuck(false);
  }

  const mascotMsg =
    project.events.length === 0
      ? "Every maker starts with one small try. What will you try first?"
      : persevered
        ? "You got stuck and kept going. That's real maker grit."
        : "Nice work! Keep logging your journey. The messy parts count most.";

  return (
    <section className="quest" aria-label={project.title}>
      <header className="hero">
        <h2 className="hero__title">{project.title}</h2>
        <p className="hero__q">
          <b>Your quest:</b> {project.drivingQuestion}
        </p>
        <div className="hero__meta">
          <span className="chip chip--accent">{audienceLabel(project.audience)}</span>
          <span className="chip">{project.source === "self" ? "Your idea" : "A quest for you"}</span>
        </div>
        <p className="hero__how">
          <b>How:</b> {project.authenticMethod}
        </p>
        {project.craftScaffold ? (
          <p className="hero__tip">
            <b>Tip:</b> {project.craftScaffold}
          </p>
        ) : null}
      </header>

      {persevered ? (
        <div className="callout" role="status">
          <span className="callout__icon">
            <SparkIcon />
          </span>
          You bounced back from a getting-stuck moment, and that&apos;s the good stuff.
        </div>
      ) : null}

      <div className="composer">
        <h3 className="composer__title">Add to your quest log</h3>
        <div className="kinds">
          {ENTRY_KINDS.map((k) => (
            <button
              key={k.kind}
              type="button"
              className={`kindbtn${k.kind === kind ? " kindbtn--on" : ""}`}
              aria-pressed={k.kind === kind}
              onClick={() => setKind(k.kind)}
            >
              <KindIcon kind={k.kind} size={16} />
              {k.label}
            </button>
          ))}
        </div>
        <div className="composer__row">
          <input
            className="composer__in"
            placeholder={entryFor(kind).prompt}
            aria-label={entryFor(kind).prompt}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
          />
          <button type="button" className="btn btn--add" onClick={submit}>
            Add
          </button>
        </div>
        {kind === "outcome" ? (
          <label className="stuck">
            <input type="checkbox" checked={stuck} onChange={(e) => setStuck(e.target.checked)} />
            I got stuck or it broke (that&apos;s okay, it&apos;s part of it!)
          </label>
        ) : null}
      </div>

      <div className="timeline" aria-label="Quest log">
        {entries.length === 0 ? (
          <p className="log__empty">Your quest log is empty. Log your first try above.</p>
        ) : (
          entries.map((e, i) => <TimelineItem key={e.id} event={e} index={i} />)
        )}
      </div>

      <button type="button" className="btn btn--show showbtn" onClick={onShowcase}>
        <span className="deco-emoji" aria-hidden="true">
          🎉{" "}
        </span>
        Showtime! Share it
      </button>

      <div className="mascot">
        <Mascot size={48} />
        <p className="mascot__bubble">{mascotMsg}</p>
      </div>
    </section>
  );
}

function TimelineItem({ event, index }: { event: WorkEvent; index: number }): JSX.Element {
  const e = entryFor(event.kind);
  const category =
    event.kind === "outcome" && event.stuck
      ? "struggle"
      : event.kind === "ai_help"
        ? "help"
        : event.kind === "artifact" || event.kind === "showcase"
          ? "make"
          : "plain";
  const hasTags = event.stuck || event.kind === "ai_help" || Boolean(event.artifact);
  return (
    <article className="tl-item" style={{ "--i": index } as CSSProperties}>
      <div className={`tl-node${category === "plain" ? "" : ` tl-node--${category}`}`}>
        <KindIcon kind={event.kind} />
      </div>
      <div className="tl-body">
        <div className="tl-kind">{e.label}</div>
        <p className="tl-text">{event.text}</p>
        {hasTags ? (
          <div className="tl-tags">
            {event.stuck ? <span className="mini mini--stuck">got stuck</span> : null}
            {event.kind === "ai_help" ? <span className="mini mini--ai">robot helped</span> : null}
            {event.artifact ? (
              <span className="mini mini--made">made: {event.artifact.title}</span>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function Showcase({ project, onClose }: { project: Project; onClose: () => void }): JSX.Element {
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label="Showtime" onClick={onClose}>
      <div className="modal__card" onClick={(e) => e.stopPropagation()}>
        <div className="deco-emoji" style={{ fontSize: "2.4rem" }} aria-hidden="true">
          🎉🌟🎈
        </div>
        <div className="modal__h">Showtime!</div>
        <p className="modal__body">
          You&rsquo;d share <b>{project.title}</b> with{" "}
          {audienceLabel(project.audience).toLowerCase()}, and they&rsquo;d see the whole journey,
          not just the finish.
        </p>
        <p className="modal__note">This is a practice showcase. Nothing is posted anywhere.</p>
        <button type="button" className="btn btn--new" onClick={onClose}>
          Back to making
        </button>
      </div>
    </div>
  );
}
