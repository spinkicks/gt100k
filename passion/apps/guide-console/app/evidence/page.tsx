import type { Metadata } from "next";
import Link from "next/link";
import type { JSX } from "react";

import { AREAS, CLAIMS, type Claim } from "@gt100k/research";
import { BasisTag } from "../basis.js";

// The Evidence base — every measurement and recommendation this product makes, with the research
// behind it, in one place. The `WhyThis` popover answers "why this number?" in the moment; this page
// is the version you can read end to end, so it doubles as guide onboarding.
//
// It is static: the registry is data, so there is nothing to fetch and nothing to interact with, and
// the page renders on the server.

export const metadata: Metadata = {
  title: "Evidence base — PassionLab Guide Console",
  description:
    "What the guide console measures, why, and the research behind each measurement. Chosen defaults are marked as ours rather than dressed up as findings.",
};

const BY_AREA = new Map<string, Claim[]>();
for (const c of CLAIMS) {
  const group = BY_AREA.get(c.area);
  if (group === undefined) BY_AREA.set(c.area, [c]);
  else group.push(c);
}

// `AREAS` sets the order. Anything the registry grows that is not in that list still gets rendered,
// on the end — an uncited claim is a problem, an unlisted one must not silently vanish.
const KNOWN: readonly string[] = AREAS;
const ORDER: readonly string[] = [
  ...KNOWN,
  ...[...BY_AREA.keys()].filter((a) => !KNOWN.includes(a)),
].filter((a) => BY_AREA.has(a));

function areaId(area: string): string {
  return `ev-${area.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

function Entry({ c }: { c: Claim }): JSX.Element {
  return (
    <li className="why-entry">
      <div className="why-entry__hd">
        <h3 className="why-entry__k">{c.label}</h3>
        <BasisTag basis={c.basis} />
      </div>
      <p className="why-entry__why">{c.why}</p>
      {c.limit !== undefined ? (
        <p className="why-entry__limit">
          <b>Honest limit:</b> {c.limit}
        </p>
      ) : null}
      {c.sources.length > 0 ? (
        <ul className="why-entry__src">
          {c.sources.map((s) => (
            <li key={s.url}>
              <a className="why-src" href={s.url} target="_blank" rel="noopener noreferrer">
                {s.authors} ({s.year})<span className="ov-sr"> — opens in a new tab</span>
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="why-entry__nosrc">
          No published source: this is a default we picked, not a finding.
        </p>
      )}
    </li>
  );
}

export default function EvidencePage(): JSX.Element {
  return (
    <main className="main main--focus why-page" aria-label="Evidence base">
      <div className="why-page__hd">
        <p className="eyebrow">PassionLab</p>
        <h1>Evidence base</h1>
        <p className="why-page__lede">
          This is everything the console measures and why, with the research behind each one. Items
          marked <BasisTag basis="chosen" /> are choices we made rather than findings — defensible,
          but ours, and we would rather say so than dress them up as science. Where the evidence is
          thin, contested, or borrowed from a different group of people, the limit says so. Nothing
          here is a statement about any particular child.
        </p>
        <Link className="btn btn--sm why-back" href="/">
          Back to the console
        </Link>
      </div>

      {ORDER.map((area) => (
        <section className="card" key={area} aria-labelledby={areaId(area)}>
          <div className="card__hd">
            <div>
              <h2 id={areaId(area)}>{area}</h2>
              <p>
                {BY_AREA.get(area)?.length ?? 0}{" "}
                {(BY_AREA.get(area)?.length ?? 0) === 1 ? "entry" : "entries"}
              </p>
            </div>
          </div>
          <ul className="why-list">
            {BY_AREA.get(area)?.map((c) => (
              <Entry key={c.id} c={c} />
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
