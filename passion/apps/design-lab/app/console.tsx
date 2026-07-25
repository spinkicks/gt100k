import { Fragment } from "react";

/**
 * A faithful, full-width Guide Console screen. Structure mirrors the console we already
 * have; the content encodes the research rules (evidence x agreement instead of a score,
 * natural frequencies, a value-suppressed "not sure yet", one interruptive alarm, and a
 * proposal you negotiate rather than approve).
 */

const KIDS = [
  { i: "AM", n: "Ari Mercado", m: "2 tracked · 1 ready", on: true },
  { i: "BI", n: "Bex Ito", m: "2 tracked · 1 ready", on: false },
  { i: "CO", n: "Cyrus Okafor", m: "2 tracked", on: false },
  { i: "DP", n: "Dulce Park", m: "3 tracked · 2 ready", on: false },
];

const TABS = [
  { k: "Hypotheses", n: 2, on: true },
  { k: "Wellbeing", n: 2, alert: true },
  { k: "Plan", n: 0 },
  { k: "Family", n: 5 },
  { k: "Access", n: 0 },
];

const MODES = ["Build", "Investigate", "Compose", "Perform", "Explain", "Care"];
const DOMAINS = [
  { d: "Music & Sound", w: [1, 2, 0, 3, 0, 0] },
  { d: "Code & Computers", w: [3, 2, 0, 0, 1, 0] },
  { d: "Art & Motion", w: [0, 0, 2, 1, 0, 0] },
  { d: "Making & Eng.", w: [2, 1, 0, 0, 0, 1] },
];

function Freq({ on, unsure }: { on: number; unsure?: boolean }): JSX.Element {
  return (
    <div className="freq__dots" role="img" aria-label={`about ${on} in 10`}>
      {Array.from({ length: 10 }, (_, i) => (
        <i key={i} data-on={i < on ? "true" : "false"} aria-hidden="true" />
      ))}
    </div>
  );
}

export function Console(): JSX.Element {
  return (
    <div className="app">
      {/* Pane 1 */}
      <aside className="rail">
        <div className="brand">
          <span className="brand__mark">P</span>
          <span className="brand__name">
            PassionLab
            <br />
            Guide Console
          </span>
        </div>
        <div className="rail__search">Search children</div>
        <div className="rail__label">Children</div>
        {KIDS.map((k) => (
          <div className="kid" key={k.i} aria-current={k.on ? "true" : undefined}>
            <span className="kid__av">{k.i}</span>
            <span>
              <span className="kid__name">{k.n}</span>
              <span className="kid__meta">{k.m}</span>
            </span>
          </div>
        ))}
        <div className="rail__foot">
          <span className="synthetic">Synthetic data only</span>
        </div>
      </aside>

      {/* Pane 2 */}
      <nav className="spikes">
        <div className="rail__label">Specializations</div>
        <div className="spike" aria-current="true">
          <div className="spike__name">Music &amp; Sound › Audio Systems</div>
          <div className="spike__state">
            <span className="dot" /> Emerging · Build
          </div>
        </div>
        <div className="spike">
          <div className="spike__name">Art &amp; Motion › Dance</div>
          <div className="spike__state">
            <span className="dot dot--quiet" /> Exploring · Perform
          </div>
        </div>
      </nav>

      {/* Pane 3 */}
      <main className="work">
        <div className="tabs" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.k}
              className="tab"
              role="tab"
              aria-selected={t.on ? "true" : "false"}
              type="button"
            >
              {t.k}
              {t.alert ? <span className="tab__alert" aria-label="needs review" /> : null}
              <span className="tab__n">{t.n}</span>
            </button>
          ))}
        </div>

        <div className="work__body">
          <div className="section__h">
            <h2>What the evidence suggests</h2>
            <p>Ari Mercado · updated 2 days ago</p>
          </div>

          <div className="alarm">
            <span className="alarm__mark">!</span>
            <div>
              <h3>Quiet devaluation, three weeks running</h3>
              <p>Doing it flatly and no longer sharing it. Worth a warm, non-evaluative check-in.</p>
            </div>
            <button className="btn" type="button">
              Open wellbeing
            </button>
          </div>

          <div className="grid2">
            <article className="card">
              <div className="card__top">
                <div>
                  <p className="card__path">Music &amp; Sound › Audio Systems</p>
                  <h3 className="card__claim">Keeps choosing to build audio systems, unprompted.</h3>
                </div>
                <span className="chip">Build</span>
              </div>

              <div className="axes">
                <div>
                  <div className="axis__k">Evidence</div>
                  <div className="axis__v">Moderate</div>
                </div>
                <div>
                  <div className="axis__k">Agreement</div>
                  <div className="axis__v">High</div>
                </div>
                <div>
                  <div className="axis__k">Calibration</div>
                  <div className="axis__v axis__v--calm">Calibrated</div>
                </div>
              </div>

              <div className="freq">
                <Freq on={7} />
                <p className="freq__note">
                  About 7 in 10 children showing this pattern kept returning to it after the
                  prompting stopped.
                </p>
              </div>

              <div className="ledger">
                <div>
                  <h4>Supporting</h4>
                  <ul>
                    <li>Returned 4 times unprompted</li>
                    <li>Chose the harder build twice</li>
                    <li>Recovered after a failure</li>
                  </ul>
                </div>
                <div>
                  <h4>Disconfirming</h4>
                  <ul>
                    <li className="is-none">none yet</li>
                  </ul>
                </div>
              </div>

              <div className="next">
                <b>Next test</b>
                <span>Gate passed. A human may promote this with an autonomy sign-off.</span>
              </div>

              <div className="acts">
                <button className="btn btn--primary" type="button">
                  Promote
                </button>
                <button className="btn" type="button">
                  Park
                </button>
                <button className="btn" type="button">
                  Contest
                </button>
                <span className="acts__spacer">
                  <b>Emerging</b>3 of 3 checks
                </span>
              </div>
            </article>

            <article className="card card--unsure">
              <div className="card__top">
                <div>
                  <p className="card__path">Art &amp; Motion › Dance</p>
                  <h3 className="card__claim">Too early to say anything about dance.</h3>
                </div>
                <span className="chip">Perform</span>
              </div>

              <div className="axes">
                <div>
                  <div className="axis__k">Evidence</div>
                  <div className="axis__v axis__v--quiet">Limited</div>
                </div>
                <div>
                  <div className="axis__k">Agreement</div>
                  <div className="axis__v axis__v--quiet">Low</div>
                </div>
                <div>
                  <div className="axis__k">Calibration</div>
                  <div className="axis__v axis__v--quiet">Not stated</div>
                </div>
              </div>

              <div className="freq">
                <Freq on={5} unsure />
                <p className="freq__note">
                  No likelihood given. Thin evidence renders flat on purpose, so two uncertain
                  reads cannot be told apart at a glance.
                </p>
              </div>

              <div className="ledger">
                <div>
                  <h4>Supporting</h4>
                  <ul>
                    <li className="is-none">none yet</li>
                  </ul>
                </div>
                <div>
                  <h4>Disconfirming</h4>
                  <ul>
                    <li>Only ever attended when prompted</li>
                  </ul>
                </div>
              </div>

              <div className="next">
                <b>Next test</b>
                <span>Offer the cell again unprompted and watch for a voluntary return.</span>
              </div>

              <div className="acts">
                <button className="btn" type="button">
                  Park
                </button>
                <span className="acts__spacer">
                  <b>Exploring</b>gathering signal
                </span>
              </div>
            </article>
          </div>

          <div className="cov">
            <div className="section__h">
              <h2 style={{ fontSize: "var(--text-base)" }}>Coverage</h2>
              <p>Where this child has and has not been given a real chance</p>
            </div>
            <div className="cov__grid">
              <span />
              {MODES.map((m) => (
                <span className="cov__hd" key={m}>
                  {m}
                </span>
              ))}
              {DOMAINS.map((row) => (
                <Fragment key={row.d}>
                  <span className="cov__row">{row.d}</span>
                  {row.w.map((w, i) => (
                    <span className="cell" data-w={w} key={`${row.d}-${i}`} />
                  ))}
                </Fragment>
              ))}
            </div>
            <p className="cov__legend">
              Empty cells are gaps in exposure, not evidence of dislike.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
