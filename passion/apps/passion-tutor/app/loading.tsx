export default function Loading() {
  return (
    <main className="status-shell" aria-busy="true">
      <aside className="status-panel" aria-label="Passion Tutor">
        <p className="status-wordmark">Passion Tutor</p>
        <p className="synthetic-note">Synthetic practice project</p>
      </aside>

      <section className="status-copy">
        <output className="visually-hidden" aria-live="polite">
          Getting your first question ready.
        </output>
        <p className="status-kicker">One moment</p>
        <h1>Getting your first question ready.</h1>
        <p>We’re opening the synthetic practice project and its starting prompt.</p>
      </section>
    </main>
  );
}
