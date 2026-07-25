"use client";

// The Overview tab: the visual summary a non-technical guide lands on. Four stat tiles, returns over
// time, where the child's time goes, weekly engagement, a wellbeing read, and the specializations
// table. Every number comes from `buildOverview` (overview.ts), which derives it all from the child's
// real interaction log — nothing here is mock data.
//
// Two things hold this together:
//   * A card whose chart cannot say something true renders a quiet, centred "not enough yet" note in
//     its place, with the reason. The sparse child reads as intentional, never as broken.
//   * Colour is always doubled by text: every pip, pill and badge sits next to a written label, and
//     each chart carries a screen-reader summary of its actual numbers.
import { useMemo, type JSX } from "react";
import { AreaChart, BarChart, Donut, Spark } from "./charts.js";
import { buildOverview, type ShareSlice, type StatTile, type TimeSeries } from "./overview.js";
import { WhyThis } from "./why.js";
import type { ConsoleController } from "./useConsole.js";
import type { HypothesisCard } from "@gt100k/hypothesis-store";

const SLICE_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"];

/**
 * Which tiles carry a citation, by the tile key `buildOverview` assigns. Sessions is a plain count
 * of what happened, so there is nothing to cite; the rest are measurement choices we should be able
 * to defend on the spot.
 */
const TILE_CLAIMS: Readonly<Record<string, string>> = {
  voluntary: "voluntary-returns",
  depth: "depth-signals",
  coverage: "coverage",
};

/** The one place a chart's shape is chosen: charts only draw when the derivation says they can. */
function Blank({ reason }: { reason: string }): JSX.Element {
  return (
    /* biome-ignore lint/a11y/useSemanticElements: this live region wraps two <p> elements, and
       <output> only accepts phrasing content, so the swap would produce invalid markup. */
    <div className="ov-blank" role="status">
      <p className="ov-blank__k">Not enough activity yet to chart</p>
      <p className="ov-blank__d">{reason}</p>
    </div>
  );
}

function seriesSentence(label: string, labels: readonly string[], data: readonly number[]): string {
  return `${label}: ${labels.map((l, i) => `${l} ${data[i] ?? 0}`).join(", ")}.`;
}

function Tile({ t }: { t: StatTile }): JSX.Element {
  const color =
    t.trend?.dir === "up" ? "var(--good)" : t.trend?.dir === "down" ? "var(--bad)" : "var(--chart-1)";
  const claimId = TILE_CLAIMS[t.key];
  return (
    <div className="tile">
      <div className="tile__k why-head">
        {t.label}
        {claimId !== undefined ? <WhyThis id={claimId} /> : null}
      </div>
      <div className="tile__row">
        <span className="tile__v">{t.value}</span>
        {t.trend ? (
          <span className={`delta delta--${t.trend.dir}`} aria-label={t.trend.aria} title={t.trend.aria}>
            {t.trend.label}
          </span>
        ) : null}
      </div>
      <p className="tile__ctx">{t.context}</p>
      <div className="tile__spark">
        {t.spark ? <Spark data={t.spark} color={color} /> : null}
      </div>
    </div>
  );
}

export function OverviewPanel({
  ctrl,
  onReview,
  onOpenWellbeing,
}: {
  ctrl: ConsoleController;
  onReview: (card: HypothesisCard, index: number) => void;
  onOpenWellbeing: () => void;
}): JSX.Element {
  const ov = useMemo(
    () => buildOverview(ctrl.kid, ctrl.vm.cards, ctrl.wellbeing),
    [ctrl.kid, ctrl.vm.cards, ctrl.wellbeing],
  );
  const { returns, engagement, share, wellbeing } = ov;

  return (
    <div className="ovbody" role="tabpanel" aria-label="Overview">
      <section className="tiles" aria-label="Headline numbers">
        {ov.tiles.map((t) => (
          <Tile key={t.key} t={t} />
        ))}
      </section>

      <section className="row2">
        <ReturnsCard s={returns} />
        <ShareCard ok={share.ok} reason={share.reason} slices={share.slices} total={share.total} />
      </section>

      <section className="row2">
        <EngagementCard s={engagement} />

        <div className={`card${wellbeing.status === "good" ? "" : " card--alarm"}`}>
          <div className="card__hd">
            <div>
              <div className="why-head">
                <h2>Wellbeing</h2>
                <WhyThis id="wellbeing-behaviour-only" what="wellbeing from behaviour alone" />
              </div>
              <p>Behaviour only. No cameras, no emotion detection.</p>
            </div>
            <span className={`badge badge--${wellbeing.status}`}>{wellbeing.badge}</span>
          </div>
          {wellbeing.tracked === 0 ? (
            <Blank reason="There are no tracked specializations for this child yet, so there is nothing to read." />
          ) : (
            <>
              <ul className="checks">
                {wellbeing.checks.map((c) => (
                  <li key={c.key}>
                    <span className={`pip pip--${c.status}`} aria-hidden="true" />
                    {c.label}
                    <b>{c.value}</b>
                  </li>
                ))}
              </ul>
              <button className="btn btn--primary" type="button" onClick={onOpenWellbeing}>
                Open wellbeing review
              </button>
            </>
          )}
        </div>
      </section>

      <section className="card">
        <div className="card__hd">
          <div>
            <h2>Specializations</h2>
            <p>What the evidence suggests, and how confident we are</p>
          </div>
        </div>
        {ov.rows.length === 0 ? (
          <Blank reason="No specializations are being tracked for this child yet. Exploration is still in progress." />
        ) : (
          <table className="ov-tbl">
            <thead>
              <tr>
                <th scope="col">Area</th>
                <th scope="col">Work style</th>
                <th scope="col">Stage</th>
                <th scope="col">
                  <span className="why-head">
                    Confidence
                    <WhyThis id="confidence-lower-bound" what="confidence this way" />
                  </span>
                </th>
                <th scope="col">Activity</th>
                <th scope="col">Status</th>
                <th scope="col">
                  <span className="ov-sr">Action</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {ov.rows.map((r) => {
                const card = ctrl.vm.cards[r.index];
                return (
                  <tr key={r.id}>
                    <td className="ov-tbl__name">{r.area}</td>
                    <td>
                      <span className="chip">{r.mode}</span>
                    </td>
                    <td>{r.stage}</td>
                    <td>
                      <div className="meter">
                        <div className="meter__bar">
                          <span style={{ width: `${r.confidence}%` }} data-s={r.status} />
                        </div>
                        <span className="meter__n">{r.confidence}%</span>
                      </div>
                    </td>
                    <td>
                      {r.spark ? (
                        <Spark data={r.spark} color="var(--chart-1)" />
                      ) : (
                        <span className="ov-none">Too little to show</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge badge--${r.status}`}>{r.statusLabel}</span>
                    </td>
                    <td>
                      <button
                        className="btn btn--sm"
                        type="button"
                        onClick={() => (card ? onReview(card, r.index) : undefined)}
                      >
                        Review<span className="ov-sr"> {r.area}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function ReturnsCard({ s }: { s: TimeSeries }): JSX.Element {
  return (
    <div className="card">
      <div className="card__hd">
        <div>
          <div className="why-head">
            <h2>Returns over time</h2>
            <WhyThis id="prompted-vs-voluntary" what="voluntary and prompted returns separately" />
          </div>
          <p>Unprompted returns are the signal. Prompted ones are shown for contrast.</p>
        </div>
        {/* A legend for a chart that is not drawn would promise data the card does not have. */}
        {s.ok ? (
          <div className="ov-legend">
            <span>
              <i style={{ background: "var(--chart-1)" }} />
              Voluntary
            </span>
            <span>
              <i style={{ background: "var(--chart-2)" }} />
              Prompted
            </span>
          </div>
        ) : null}
      </div>
      {s.ok ? (
        <>
          <AreaChart
            labels={s.labels}
            series={[
              { name: "voluntary", color: "var(--chart-1)", data: s.a },
              { name: "prompted", color: "var(--chart-2)", data: s.b },
            ]}
          />
          <p className="ov-sr">
            {seriesSentence("Voluntary returns by month", s.labels, s.a)}{" "}
            {seriesSentence("Prompted returns by month", s.labels, s.b)}
          </p>
          <p className="ov-foot">{s.range}</p>
        </>
      ) : (
        <Blank reason={s.reason} />
      )}
    </div>
  );
}

function EngagementCard({ s }: { s: TimeSeries }): JSX.Element {
  return (
    <div className="card">
      <div className="card__hd">
        <div>
          <h2>Weekly engagement</h2>
          <p>Sessions and depth signals per week</p>
        </div>
        {s.ok ? (
          <div className="ov-legend">
            <span>
              <i style={{ background: "var(--chart-1)" }} />
              Sessions
            </span>
            <span>
              <i style={{ background: "var(--chart-3)" }} />
              Depth
            </span>
          </div>
        ) : null}
      </div>
      {s.ok ? (
        <>
          <BarChart
            labels={s.labels}
            data={s.a}
            color="var(--chart-1)"
            compare={s.b}
            compareColor="var(--chart-3)"
          />
          <p className="ov-sr">
            {seriesSentence("Sessions by week", s.labels, s.a)}{" "}
            {seriesSentence("Depth signals by week", s.labels, s.b)}
          </p>
          <p className="ov-foot">{s.range}</p>
        </>
      ) : (
        <Blank reason={s.reason} />
      )}
    </div>
  );
}

function ShareCard({
  ok,
  reason,
  slices,
  total,
}: {
  ok: boolean;
  reason: string;
  slices: readonly ShareSlice[];
  total: number;
}): JSX.Element {
  return (
    <div className="card">
      <div className="card__hd">
        <div>
          <h2>Where their time goes</h2>
          <p>Share of logged visits by area</p>
        </div>
        <WhyThis id="cross-area-comparison" what="areas cannot be compared directly yet" />
      </div>
      {ok ? (
        <div className="donutwrap">
          <Donut
            size={152}
            slices={slices.map((s, i) => ({
              name: s.key,
              value: s.percent,
              color: SLICE_COLORS[i % SLICE_COLORS.length]!,
            }))}
          />
          <ul className="dlegend">
            {slices.map((s, i) => (
              <li key={s.key}>
                <i style={{ background: SLICE_COLORS[i % SLICE_COLORS.length] }} />
                {s.label} <b>{s.percent}%</b>
              </li>
            ))}
          </ul>
          <p className="ov-sr">
            Share of {total} logged visits:{" "}
            {slices.map((s) => `${s.label} ${s.percent} percent`).join(", ")}.
          </p>
        </div>
      ) : (
        <Blank reason={reason} />
      )}
    </div>
  );
}
