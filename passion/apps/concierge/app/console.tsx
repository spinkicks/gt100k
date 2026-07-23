"use client";

// The concierge chat surface — a calm, legible instrument (NOT a game). A child asks a niche
// question; the server route runs the child-safe pipeline and returns a `ConciergeResponse`, which we
// render with its KIND (answer / refused / escalated) carried by a text label + glyph (never colour
// alone, WCAG 2.2 AA), the citations behind every claim, and the smallest testable next step (probe).
// Installs `window.__qa` (via a ref) for the LOOP_QA usability gate; `primaryAction()` asks the seeded
// gap question. Motion is subtle and disabled under prefers-reduced-motion (globals.css).
import { useCallback, useEffect, useRef, useState, type FormEvent, type JSX } from "react";
import type { ConciergeResponse } from "@gt100k/concierge";
import { buildQaState, installQa } from "./qa.js";
import { SEED_DISTRESS_QUESTION, SEED_GAP_QUESTION } from "./seed.js";

const KIND_LABEL: Record<ConciergeResponse["kind"], string> = {
  answer: "Answer",
  refused: "Can't help with that",
  escalated: "Bringing in a grown-up",
};

export function Concierge(): JSX.Element {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState<ConciergeResponse | null>(null);
  const [pending, setPending] = useState(false);

  // A ref mirrors the latest response so `window.__qa.state()` never reads a stale closure.
  const ref = useRef<ConciergeResponse | null>(null);
  ref.current = response;

  const ask = useCallback(async (message: string): Promise<void> => {
    const trimmed = message.trim();
    if (trimmed.length === 0) return;
    setPending(true);
    try {
      const res = await fetch("/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
      setResponse((await res.json()) as ConciergeResponse);
    } catch {
      setResponse({ kind: "refused", reason: "internal" });
    } finally {
      setPending(false);
    }
  }, []);

  // Install the `window.__qa` contract once; the callbacks read the live ref so a seeded gap answer
  // (kind "answer", ≥1 citation) is observable in `state()` after `primaryAction()` settles.
  useEffect(() => {
    installQa(
      () => buildQaState(ref.current),
      () => {
        void ask(SEED_GAP_QUESTION);
      },
    );
  }, [ask]);

  function onSubmit(e: FormEvent): void {
    e.preventDefault();
    void ask(input);
  }

  return (
    <div className="app">
      <header className="brand">
        <div>
          <h1>PassionLab Concierge</h1>
          <p>Ask about anything you&rsquo;re curious about — I&rsquo;ll point you to real, trusted material.</p>
        </div>
        <span className="chip">Synthetic data only</span>
      </header>

      <form className="composer" onSubmit={onSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. How do tardigrades survive in space?"
          aria-label="Ask the concierge a question"
        />
        <button className="btn" type="submit" disabled={pending || input.trim().length === 0}>
          Ask
        </button>
      </form>

      <div className="seedrow">
        <button className="btn btn--ghost" type="button" onClick={() => void ask(SEED_GAP_QUESTION)}>
          Try a gap question
        </button>
        <button
          className="btn btn--ghost"
          type="button"
          onClick={() => void ask(SEED_DISTRESS_QUESTION)}
        >
          Try the safety path
        </button>
      </div>

      <div aria-live="polite">
        {pending && <p className="pending">Thinking&hellip;</p>}
        {!pending && response && <ResponseCard response={response} />}
      </div>

      <p className="foot">
        The concierge answers from a curated library first, uses grounded open-web retrieval only on a
        genuine gap, and never counsels — distress is handed to a person. Chat is never scored.
      </p>
    </div>
  );
}

function ResponseCard({ response }: { response: ConciergeResponse }): JSX.Element {
  const citations = response.citations ?? [];
  return (
    <article className={`card kind-card kind-card--${response.kind}`} data-qa-kind={response.kind}>
      <div className={`kind kind--${response.kind}`}>
        <span className="dot" aria-hidden="true" />
        {KIND_LABEL[response.kind]}
      </div>

      {response.kind === "escalated" && (
        <p className="answer">
          That sounds really important. I&rsquo;m not the right helper for this — I&rsquo;m bringing in a
          trusted grown-up who can talk with you.
        </p>
      )}

      {response.kind === "refused" && (
        <p className="answer">
          I couldn&rsquo;t find a trustworthy, grounded answer for that, so I won&rsquo;t guess.
        </p>
      )}

      {response.kind === "answer" && response.text && <p className="answer">{response.text}</p>}

      {response.probe && <p className="probe">Next step · {response.probe}</p>}

      {citations.length > 0 && (
        <>
          <p className="eyebrow">Where this comes from</p>
          <ul className="cites">
            {citations.map((c) => (
              <li className="cite" key={c.url}>
                <a href={c.url} target="_blank" rel="noreferrer">
                  {c.title}
                </a>
                <span className="rep mono" data-qa-citation>
                  rep {c.reputation.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </article>
  );
}
