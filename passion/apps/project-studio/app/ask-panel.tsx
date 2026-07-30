"use client";

// Asking a question, where the question actually comes up.
//
// This was its own application on its own port: a single text field on an otherwise empty page,
// reachable from the front door as though "ask a question" were a place you go. It is not. A child
// asks "how do I make it bounce?" in the middle of building the thing that will not bounce, and
// making them leave their project to ask it is the reason nobody would have used it.
//
// So it lives beside the quest log now. Same pipeline, same route, same ten stages — curated
// library first, grounded open-web only on a genuine gap, cite-or-refuse, distress handed to a
// person, never scored. What changed is where the child is standing when they use it.
//
// The `window.__qa` install that the standalone carried is deliberately NOT here: the studio owns
// that contract and installing a second one would have the last mount win, silently breaking
// whichever gate ran second.
import { useCallback, useState, type FormEvent, type JSX } from "react";

import type { ConciergeResponse } from "@gt100k/concierge";

import { AskIcon } from "./icons.js";

const KIND_LABEL: Record<ConciergeResponse["kind"], string> = {
  answer: "Here's what I found",
  refused: "I couldn't find a good answer",
  escalated: "Getting a grown-up",
};

export function AskPanel(): JSX.Element {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState<ConciergeResponse | null>(null);
  const [pending, setPending] = useState(false);

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

  function onSubmit(e: FormEvent): void {
    e.preventDefault();
    void ask(input);
  }

  return (
    <section className="ask" aria-labelledby="ask-h">
      <h3 className="ask__title" id="ask-h">
        Stuck on something?
      </h3>
      <p className="ask__lede">
        Ask anything about what you are making. Every answer comes with where it came from, so you
        can go and check.
      </p>

      <form className="ask__form" onSubmit={onSubmit}>
        <input
          className="ask__in"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. How do I make something bounce?"
          aria-label="Ask a question about your project"
        />
        <button
          className="btn ask__go"
          type="submit"
          disabled={pending || input.trim().length === 0}
        >
          <AskIcon size={16} />
          Ask
        </button>
      </form>

      <div aria-live="polite">
        {pending ? <p className="ask__pending">Looking&hellip;</p> : null}
        {!pending && response ? <Answer response={response} /> : null}
      </div>
    </section>
  );
}

function Answer({ response }: { response: ConciergeResponse }): JSX.Element {
  const citations = response.citations ?? [];
  return (
    <article className={`ask__card ask__card--${response.kind}`} data-qa-kind={response.kind}>
      {/* The kind is carried by a word and a glyph, never by colour alone. */}
      <p className="ask__kind">{KIND_LABEL[response.kind]}</p>

      {response.kind === "escalated" ? (
        <p className="ask__body">
          That sounds really important, and I am not the right helper for it. I am getting a
          grown-up you trust so they can talk with you.
        </p>
      ) : null}

      {response.kind === "refused" ? (
        <p className="ask__body">
          I could not find anything solid enough to be sure, so I am not going to guess at it.
        </p>
      ) : null}

      {response.kind === "answer" && response.text ? (
        <p className="ask__body">{response.text}</p>
      ) : null}

      {response.probe ? <p className="ask__probe">Try this next · {response.probe}</p> : null}

      {citations.length > 0 ? (
        <>
          <p className="ask__sources-lead">Where this comes from</p>
          <ul className="ask__sources">
            {citations.map((c) => (
              <li key={c.url}>
                <a href={c.url} target="_blank" rel="noreferrer noopener">
                  {c.title}
                </a>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </article>
  );
}
