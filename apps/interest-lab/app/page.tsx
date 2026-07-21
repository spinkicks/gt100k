export default function Page() {
  return (
    <>
      <a className="skip-link" href="#foundation-status">
        Skip to foundation status
      </a>

      <main className="shell">
        <header className="masthead">
          <div className="title-group">
            <p className="context-line">Interest Lab · synthetic preview</p>
            <h1>The Curiosity Atelier</h1>
            <p className="lede">
              A calm place to try different kinds of work, notice what draws you back, and keep
              every possibility open.
            </p>
          </div>

          <p className="status-pill">
            <span aria-hidden="true" className="status-mark" />
            Foundation ready
          </p>
        </header>

        <section
          className="workspace material"
          id="foundation-status"
          aria-labelledby="shell-title"
        >
          <div className="world-preview">
            <div className="preview-copy">
              <p className="surface-name">Child surface</p>
              <h2 id="shell-title">Quest world foundation</h2>
              <p>
                The accessible two-dimensional quest board will arrive before the richer world. Both
                will share one view of the same choices and evidence.
              </p>
            </div>

            <div className="island-field" aria-hidden="true">
              <span className="island island-spark" />
              <span className="island island-tide" />
              <span className="island island-sprout" />
              <span className="beacon" />
            </div>
          </div>

          <aside className="readiness" aria-labelledby="readiness-title">
            <h2 id="readiness-title">Built into the foundation</h2>
            <ul>
              <li>
                <span aria-hidden="true" className="cue cue-spark" />
                <span>Text and shape accompany every color cue.</span>
              </li>
              <li>
                <span aria-hidden="true" className="cue cue-tide" />
                <span>
                  Motion, transparency, and spectacle can step down without losing meaning.
                </span>
              </li>
              <li>
                <span aria-hidden="true" className="cue cue-sprout" />
                <span>Rules suggest explorations; they never assign a fixed passion label.</span>
              </li>
            </ul>
            <p className="data-note">Synthetic data only · no live child records</p>
          </aside>
        </section>

        <footer>
          Rules-engine MVP · accessible 2D tier first · richer 3D presentation follows a green gate
        </footer>
      </main>
    </>
  );
}
