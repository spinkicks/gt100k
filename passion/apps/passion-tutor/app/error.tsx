"use client";

interface ErrorStateProps {
  readonly error: Error & { readonly digest?: string };
  readonly reset: () => void;
}

export default function ErrorState({ reset }: ErrorStateProps) {
  return (
    <main className="status-shell">
      <aside className="status-panel" aria-label="Passion Tutor">
        <p className="status-wordmark">Passion Tutor</p>
        <p className="synthetic-note">Synthetic practice project</p>
      </aside>

      <section className="status-copy" role="alert">
        <p className="status-kicker">A small snag</p>
        <h1>We couldn’t open your practice interview.</h1>
        <p>
          Try opening the synthetic practice project again. You won’t need to fix anything first.
        </p>
        <button className="status-retry" type="button" onClick={reset}>
          Try again
        </button>
      </section>
    </main>
  );
}
