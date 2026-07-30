import type { JSX } from "react";

// The lab index, currently empty, and kept rather than deleted.
//
// Two things have lived here and both graduated, which is the lab working rather than the lab being
// pointless:
//
//   The console mockup, built in July to pick the adult design language by putting Horizon and MUI
//   side by side at full width. MUI won, the choice is recorded in
//   `docs/decisions/2026-07-25-design-language.md`, and `apps/guide-console` has since been restyled
//   to the GT School identity on top of it. Deleted once the real console had moved past it, because
//   a second console in the old language could only teach the wrong answer to "what does this look
//   like".
//
//   The discovery wall, and the tile-art comparison that chose its art. Both moved to
//   `apps/discovery`, which is the shipped child-facing surface, when the flat pursuits catalogue
//   replaced the two-step cabin wall there.
//
// WHY THE APP STAYS. The value was never the prototypes; it is that this renders from the same token
// contract as the real apps with none of their data or routing, so a surface can be looked at full
// size before anyone commits to building it. Deleting the app would mean the next such question gets
// answered inside a real app instead, which is how the console mockup came to be a second console.
export default function Page(): JSX.Element {
  return (
    <main className="index">
      <h1>Design lab</h1>
      <p className="index__lede">
        Nothing in here at the moment. Prototypes live here while a question is open, rendered from
        the same token contract as the real apps and wired to no engine, and they move out or get
        deleted once the question is answered. The last two were the console mockup, which chose the
        adult design language, and the discovery wall, which is now <code>apps/discovery</code>.
      </p>
    </main>
  );
}
