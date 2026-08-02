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
import { groupOffers, offersForKid } from "./offer-next.js";
import { profileFor } from "./console-data.js";
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
    t.trend?.dir === "up"
      ? "var(--good)"
      : t.trend?.dir === "down"
        ? "var(--bad)"
        : "var(--chart-1)";
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
          <span
            className={`delta delta--${t.trend.dir}`}
            aria-label={t.trend.aria}
            title={t.trend.aria}
          >
            {t.trend.label}
          </span>
        ) : null}
      </div>
      <p className="tile__ctx">{t.context}</p>
      <div className="tile__spark">{t.spark ? <Spark data={t.spark} color={color} /> : null}</div>
    </div>
  );
}

/**
 * What to put in front of this child next, and why.
 *
 * Above the specializations table on purpose. That table is a read on what has already happened;
 * this is the only thing on the page that asks the guide to do something, and the thing it is
 * guarding against is invisible without it: a domain triggered and then dropped leaves a child
 * *less* interested than never trying it at all.
 */
function OfferNext({ kidId }: { kidId: string }): JSX.Element | null {
  const groups = useMemo(() => groupOffers(offersForKid(profileFor(kidId))), [kidId]);
  if (groups.length === 0) return null;

  return (
    <section className="card">
      <div className="card__hd">
        <div>
          <h2>What to offer next</h2>
          <p>From what they have already been offered</p>
        </div>
      </div>
      {/* Grouped by reason, not one flat list. The reason sentence belongs to the reason code, so a
          flat list repeats it verbatim on every row and four rows read as one paragraph. Each group
          is a real <section> with a real heading, so a screen reader gets the same structure a
          sighted guide does and can jump between the groups. */}
      <div className="offer-next">
        {groups.map((g) => (
          <section className="offer-grp" key={g.reason} data-reason={g.reason}>
            <h3 className="offer-grp__hd">
              {/* Colour is doubled by the heading text beside it, per this console's rule that
                  meaning never rests on colour. */}
              <span className="offer-grp__pip" aria-hidden="true" />
              {g.heading}
              {/* Only worth saying when it is more than one. "Owed a follow-up 4" tells a guide
                  something at a glance; "1" beside a single row is just noise. */}
              {g.offers.length > 1 ? <span className="offer-grp__n">{g.offers.length}</span> : null}
            </h3>
            <p className="offer-grp__why">{g.because}</p>
            <ul className="offer-grp__list">
              {/* The path is unique within a slate, so it is a stable key AND the thing that tells
                  two subtopics of one cabin apart. Keyed on the label before, which collided. */}
              {g.offers.map((o) => (
                <li key={o.domainPath.join("/")}>{o.label}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </section>
  );
}

export function OverviewPanel({
  ctrl,
  onReview,
}: {
  ctrl: ConsoleController;
  onReview: (card: HypothesisCard, index: number) => void;
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

      {/* SPECIALIZATIONS AND WELLBEING COME BEFORE THE CHARTS, because they are the only two things
          on this tab a guide can act on and they used to sit at positions 6 and 9 of 9. The three
          charts support no decision and were taking roughly 55% of the vertical space above them, so
          at 1440x900 the primary button landed on the fold and the table was entirely below it. The
          tab that exists to orient a guide was putting both decision surfaces out of sight. */}
      <section className="card">
        <div className="card__hd">
          <div>
            <h2>Specializations</h2>
            <p></p>
          </div>
        </div>
        {ov.rows.length === 0 ? (
          <Blank reason="Nothing tracked yet." />
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
                {/* Named for what it plots. "Activity" said nothing about the unit, which mattered
                    more than it looks: the same mark above the table is per-month, and this one used
                    to be a running total that could never fall. */}
                <th scope="col">Visits per month</th>
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
                        <>
                          <Spark data={r.spark} color="var(--chart-1)" />
                          {/* The sparkline is `aria-hidden`, so without this the whole column is
                              empty to a screen reader. The numbers are the column's content; the
                              drawing is one way of showing them. */}
                          <span className="ov-sr">{r.spark.join(", ")} visits by month</span>
                        </>
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
                        {/* "Open", not "Review". Three things on this row said review and meant
                            different things: the status badge and the rail chip both mean a
                            wellbeing escalation, while this button only navigates to the Hypotheses
                            tab. A button labelled with a verb it does not perform is the one of the
                            three most likely to be acted on. */}
                        Open<span className="ov-sr"> {r.area}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      <section className="row2">
        <OfferNext kidId={ctrl.kid} />

        {/* The wellbeing card that stood here is gone. It summarised the Wellbeing tab, and
            wellbeing is no longer a tab: the strip above carries the state, both moves and the
            review flag on every screen. A summary of something that is already on screen is
            not a summary, it is a second copy that can disagree with the first. */}
      </section>

      {/* FOLDED AWAY, and the previous comment here explains why it had to be. It said the charts
          "are context rather than a call to act", which is the same as saying they support no
          decision — and roughly 150 words of headings, subtitles, legends and footers were sitting
          on the landing tab to deliver that. Scrolling past them was the cost of reaching the thing
          a guide came for.

          Kept rather than deleted, because they are the only place the EVIDENCE behind a belief can
          be inspected: voluntary against prompted returns, coverage of what was offered, engagement
          over time. That is exactly what somebody challenging a number wants, and exactly what
          nobody wants on the way to Monday's decision. Engagement runs full width because it plots
          weeks and had the least room. */}
      <details className="ovcharts">
        <summary className="ovcharts__summary">Show the data behind this</summary>
        <section className="row2">
          <ReturnsCard s={returns} />
          <ShareCard
            ok={share.ok}
            reason={share.reason}
            slices={share.slices}
            total={share.total}
          />
        </section>

        <EngagementCard s={engagement} />
      </details>
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
          <p>Came back on their own, versus after a nudge. Prompted ones are shown for contrast.</p>
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
