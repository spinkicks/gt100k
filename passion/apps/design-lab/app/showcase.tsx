/**
 * One component set, rendered once per direction. Every component here encodes a specific
 * research finding, so the comparison is about the visual language rather than the content.
 */

function IconArray({ on, of, unsure }: { on: number; of: number; unsure?: boolean }): JSX.Element {
  return (
    <div className="freq" role="img" aria-label={`about ${on} in ${of}`}>
      {Array.from({ length: of }, (_, i) => (
        <i key={i} data-on={i < on ? "true" : "false"} aria-hidden="true" />
      ))}
    </div>
  );
}

function ConsoleSide(): JSX.Element {
  return (
    <>
      <section>
        <h2>Guide console, hypothesis</h2>
        <div className="card">
          <p className="hyp__claim">Current evidence suggests building things in code-computers.</p>
          <div className="axes">
            <span>
              Evidence <b>moderate</b>
            </span>
            <span>
              Agreement <b>high</b>
            </span>
          </div>
          <IconArray on={6} of={10} />
          <p className="freq__note">
            About 6 in 10 children showing this pattern kept returning to it unprompted.
          </p>
          <div className="ledger">
            <div>
              <b>Supporting</b>
              <ul>
                <li>Returned 4 times unprompted</li>
                <li>Chose the harder build twice</li>
              </ul>
            </div>
            <div>
              <b>Disconfirming</b>
              <ul>
                <li>Skipped it 3 sessions running</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2>The &quot;not sure yet&quot; state</h2>
        <div className="card hyp--unsure">
          <p className="hyp__claim">Music-sound is too early to call.</p>
          <div className="axes">
            <span>
              Evidence <b>limited</b>
            </span>
            <span>
              Agreement <b>low</b>
            </span>
          </div>
          <IconArray on={5} of={10} unsure />
          <p className="freq__note">
            No likelihood stated. Thin evidence renders flat on purpose, so two competing
            hypotheses cannot be read as different.
          </p>
        </div>
      </section>

      <section>
        <h2>Wellbeing, the one interruptive tier</h2>
        <div className="alarm">
          <h3>Quiet devaluation, three weeks</h3>
          <p>
            Doing it flatly and not sharing it. This is the only state in the product that uses
            this colour.
          </p>
        </div>
      </section>

      <section>
        <h2>A proposal you negotiate, not approve</h2>
        <div className="card">
          <div className="part">
            <span>Introduce a technical mentor</span>
            <span className="part__acts">
              <button className="btn">Accept</button>
              <button className="btn btn--quiet">Edit</button>
              <button className="btn btn--quiet">Later</button>
            </span>
          </div>
          <div className="part">
            <span>Widen the audience to a local showcase</span>
            <span className="part__acts">
              <button className="btn">Accept</button>
              <button className="btn btn--quiet">Edit</button>
              <button className="btn btn--quiet">Later</button>
            </span>
          </div>
        </div>
      </section>
    </>
  );
}

function StudioSide(): JSX.Element {
  return (
    <>
      <section>
        <h2>Project studio, the journey</h2>
        <div className="card">
          <h3>What tiny game would make a friend say one more try?</h3>
          <div className="tl">
            <div className="tl__item">
              <span className="tl__dot">1</span>
              <div className="tl__body">
                <div className="tl__kind">I tried something</div>
                <p className="tl__text">Made the player jump when I press space.</p>
              </div>
            </div>
            <div className="tl__item" data-stuck="true">
              <span className="tl__dot">2</span>
              <div className="tl__body">
                <div className="tl__kind">It broke</div>
                <p className="tl__text">The player jumped forever and floated off the screen.</p>
              </div>
            </div>
            <div className="tl__item">
              <span className="tl__dot">3</span>
              <div className="tl__body">
                <div className="tl__kind">I fixed it</div>
                <p className="tl__text">Only let it jump when it is touching the ground.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2>Choice, not points</h2>
        <div className="card">
          <p className="muted">What do you want to do next? Any of these, or something else.</p>
          <div className="chips">
            <button className="chip" aria-pressed="true">
              Add a scoreboard
            </button>
            <button className="chip">Make a second level</button>
            <button className="chip">Draw the character</button>
          </div>
          <p className="muted" style={{ marginTop: "var(--space-3)" }}>
            Two to four real choices, with nothing given afterward. This is the evidence-backed
            replacement for badges and streaks.
          </p>
        </div>
      </section>

      <section>
        <h2>Progress is the work itself</h2>
        <div className="card">
          <div className="artifacts">
            <span className="artifact">v1</span>
            <span className="artifact">v2</span>
            <span className="artifact">v3</span>
            <span className="artifact">v4</span>
            <span className="artifact">v5</span>
          </div>
          <p className="muted" style={{ marginTop: "var(--space-3)" }}>
            Five things you made. No score, no streak, no level.
          </p>
        </div>
      </section>
    </>
  );
}

export function Showcase({ side }: { side: "console" | "studio" }): JSX.Element {
  return <div className="surface">{side === "console" ? <ConsoleSide /> : <StudioSide />}</div>;
}
