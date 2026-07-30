import type { JSX } from "react";
import Link from "next/link";

// The lab index.
//
// This route used to be a console mockup, built in July to pick the adult design language by
// putting Horizon and MUI side by side on a full-width screen. MUI won, the choice is recorded in
// `docs/decisions/2026-07-25-design-language.md`, and the real console at `apps/guide-console`
// has since been restyled to the GT School identity on top of it.
//
// Deleted rather than kept around, because a second console that no longer matched the first was
// worse than no second console: it was static fixtures wired to nothing, styled a way the product
// had moved past, and the only thing it could still teach anyone was the wrong answer to "what does
// the console look like".
const PROTOTYPES = [
  {
    href: "/browse",
    name: "Discovery wall",
    note: "The child-facing browse surface. Real taxonomy, real curated links, hover to read and click to go in. Re-deals its order on idle so position can be told apart from preference.",
  },
  {
    href: "/browse/styles",
    name: "Tile art registers",
    note: "The same three subjects drawn minimal, flat and rendered, at tile size on the tile ground. The comparison that chose the shipped art.",
  },
] as const;

export default function Page(): JSX.Element {
  return (
    <main className="index">
      <h1>Design lab</h1>
      <p className="index__lede">
        Prototypes, rendered from the same token contract as the real apps. Nothing here is wired to
        an engine; the point is to look at things at full size before building them.
      </p>
      <ul className="index__list">
        {PROTOTYPES.map((p) => (
          <li key={p.href}>
            <Link href={p.href}>
              <strong>{p.name}</strong>
              <span>{p.note}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
