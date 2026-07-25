import { AreaChart, BarChart, Donut, Spark } from "./charts.js";

const KIDS = [
  { i: "AM", n: "Ari Mercado", m: "2 spikes", s: "warn", on: true },
  { i: "BI", n: "Bex Ito", m: "2 spikes", s: "good", on: false },
  { i: "CO", n: "Cyrus Okafor", m: "2 spikes", s: "good", on: false },
  { i: "DP", n: "Dulce Park", m: "3 spikes", s: "bad", on: false },
];

const TABS = ["Overview", "Hypotheses", "Wellbeing", "Plan", "Family", "Access"];

const MONTHS = ["Feb", "Mar", "Apr", "May", "Jun", "Jul"];
const WEEKS = ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"];

const TILES = [
  { k: "Voluntary returns", v: "28", d: "+12%", up: true, spark: [8, 11, 9, 14, 16, 15, 21, 28] },
  { k: "Depth signals", v: "14", d: "+5%", up: true, spark: [4, 5, 5, 7, 8, 9, 12, 14] },
  { k: "Sessions this month", v: "31", d: "-4%", up: false, spark: [38, 36, 35, 33, 34, 32, 31, 31] },
  { k: "Coverage", v: "68%", d: "+9%", up: true, spark: [42, 47, 51, 55, 58, 61, 65, 68] },
];

const SPIKES = [
  {
    n: "Music & Sound › Audio Systems",
    mode: "Build",
    stage: "Emerging",
    conf: 74,
    status: "good",
    statusLabel: "On track",
    spark: [30, 38, 44, 51, 58, 66, 70, 74],
  },
  {
    n: "Art & Motion › Dance",
    mode: "Perform",
    stage: "Exploring",
    conf: 38,
    status: "warn",
    statusLabel: "Needs a look",
    spark: [40, 39, 41, 38, 37, 39, 38, 38],
  },
  {
    n: "Code & Computers › Game Dev",
    mode: "Build",
    stage: "Candidate",
    conf: 81,
    status: "good",
    statusLabel: "On track",
    spark: [55, 60, 63, 68, 72, 75, 79, 81],
  },
];

function Tile({ t }: { t: (typeof TILES)[number] }): JSX.Element {
  return (
    <div className="tile">
      <div className="tile__k">{t.k}</div>
      <div className="tile__row">
        <span className="tile__v">{t.v}</span>
        <span className={`delta delta--${t.up ? "up" : "down"}`}>{t.d}</span>
      </div>
      <Spark data={t.spark} color={t.up ? "var(--good)" : "var(--bad)"} />
    </div>
  );
}

export function Console(): JSX.Element {
  return (
    <div className="app">
      <aside className="rail">
        <div className="brand">
          <span className="brand__mark">P</span>
          <span className="brand__name">PassionLab</span>
        </div>
        <div className="rail__label">Children</div>
        {KIDS.map((k) => (
          <div className="kid" key={k.i} aria-current={k.on ? "true" : undefined}>
            <span className="kid__av">{k.i}</span>
            <span className="kid__txt">
              <span className="kid__name">{k.n}</span>
              <span className="kid__meta">{k.m}</span>
            </span>
            <span className={`pip pip--${k.s}`} aria-hidden="true" />
          </div>
        ))}
        <div className="rail__foot">
          <span className="synthetic">Synthetic data only</span>
        </div>
      </aside>

      <main className="work">
        <header className="top">
          <div>
            <div className="crumb">Children / Ari Mercado</div>
            <h1>Ari Mercado</h1>
          </div>
          <div className="top__right">
            <span className="badge badge--warn">Wellbeing: watch</span>
            <span className="who">Guide: R. Alvarez</span>
          </div>
        </header>

        <nav className="tabs">
          {TABS.map((t, i) => (
            <button key={t} className="tab" aria-selected={i === 0} type="button">
              {t}
            </button>
          ))}
        </nav>

        <div className="body">
          <section className="tiles">
            {TILES.map((t) => (
              <Tile t={t} key={t.k} />
            ))}
          </section>

          <section className="row2">
            <div className="card">
              <div className="card__hd">
                <div>
                  <h2>Returns over time</h2>
                  <p>Unprompted returns are the signal. Prompted ones are shown for contrast.</p>
                </div>
                <div className="legend">
                  <span>
                    <i style={{ background: "var(--chart-1)" }} />
                    Voluntary
                  </span>
                  <span>
                    <i style={{ background: "var(--chart-2)" }} />
                    Prompted
                  </span>
                </div>
              </div>
              <AreaChart
                labels={MONTHS}
                series={[
                  { name: "vol", color: "var(--chart-1)", data: [6, 9, 12, 15, 22, 28] },
                  { name: "pro", color: "var(--chart-2)", data: [14, 13, 11, 10, 9, 7] },
                ]}
              />
            </div>

            <div className="card">
              <div className="card__hd">
                <div>
                  <h2>Where their time goes</h2>
                  <p>Share of sessions by area</p>
                </div>
              </div>
              <div className="donutwrap">
                <Donut
                  slices={[
                    { name: "Music", value: 46, color: "var(--chart-1)" },
                    { name: "Code", value: 28, color: "var(--chart-2)" },
                    { name: "Art", value: 16, color: "var(--chart-3)" },
                    { name: "Other", value: 10, color: "var(--chart-4)" },
                  ]}
                />
                <ul className="dlegend">
                  <li>
                    <i style={{ background: "var(--chart-1)" }} />
                    Music &amp; Sound <b>46%</b>
                  </li>
                  <li>
                    <i style={{ background: "var(--chart-2)" }} />
                    Code &amp; Computers <b>28%</b>
                  </li>
                  <li>
                    <i style={{ background: "var(--chart-3)" }} />
                    Art &amp; Motion <b>16%</b>
                  </li>
                  <li>
                    <i style={{ background: "var(--chart-4)" }} />
                    Everything else <b>10%</b>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          <section className="row2">
            <div className="card">
              <div className="card__hd">
                <div>
                  <h2>Weekly engagement</h2>
                  <p>Sessions and depth signals per week</p>
                </div>
                <div className="legend">
                  <span>
                    <i style={{ background: "var(--chart-1)" }} />
                    Sessions
                  </span>
                  <span>
                    <i style={{ background: "var(--chart-3)" }} />
                    Depth
                  </span>
                </div>
              </div>
              <BarChart
                labels={WEEKS}
                data={[5, 7, 6, 9, 8, 11, 10, 12]}
                color="var(--chart-1)"
                compare={[1, 2, 2, 3, 3, 4, 5, 6]}
                compareColor="var(--chart-3)"
              />
            </div>

            <div className="card card--alarm">
              <div className="card__hd">
                <div>
                  <h2>Wellbeing</h2>
                  <p>Behaviour only. No cameras, no emotion detection.</p>
                </div>
                <span className="badge badge--warn">Watch</span>
              </div>
              <ul className="checks">
                <li>
                  <span className="pip pip--bad" /> Quiet devaluation
                  <b>3 weeks</b>
                </li>
                <li>
                  <span className="pip pip--warn" /> Rising stakes
                  <b>showcase in 9 days</b>
                </li>
                <li>
                  <span className="pip pip--good" /> Rest cadence
                  <b>2 days off / week</b>
                </li>
                <li>
                  <span className="pip pip--good" /> Family pressure
                  <b>none observed</b>
                </li>
              </ul>
              <button className="btn btn--primary" type="button">
                Open wellbeing review
              </button>
            </div>
          </section>

          <section className="card">
            <div className="card__hd">
              <div>
                <h2>Specializations</h2>
                <p>What the evidence suggests, and how confident we are</p>
              </div>
              <button className="btn" type="button">
                Export
              </button>
            </div>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Area</th>
                  <th>Work style</th>
                  <th>Stage</th>
                  <th>Confidence</th>
                  <th>Trend</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {SPIKES.map((s) => (
                  <tr key={s.n}>
                    <td className="tbl__name">{s.n}</td>
                    <td>
                      <span className="chip">{s.mode}</span>
                    </td>
                    <td>{s.stage}</td>
                    <td>
                      <div className="meter">
                        <div className="meter__bar">
                          <span style={{ width: `${s.conf}%` }} data-s={s.status} />
                        </div>
                        <span className="meter__n">{s.conf}%</span>
                      </div>
                    </td>
                    <td>
                      <Spark data={s.spark} color="var(--chart-1)" />
                    </td>
                    <td>
                      <span className={`badge badge--${s.status}`}>{s.statusLabel}</span>
                    </td>
                    <td>
                      <button className="btn btn--sm" type="button">
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      </main>
    </div>
  );
}
