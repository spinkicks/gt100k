import type { JSX } from "react";

import "../browse.css";
import "./styles.css";

// The page that chose the wall's visual register. Rendered won; `browse.css` is the result.
//
// Kept live rather than archived because the choice is revisitable and the comparison is the only
// way to revisit it honestly. It is also the record of a reversal: for a day the wall carried no art
// at all, on the argument that forty-four tiles are too small for rendered detail to read and that
// Magner et al. found decorative illustration hinders learning. The second half of that was a
// misreading — the seductive-details effect is about pictures placed beside material a child is
// trying to learn, and nothing is being learned on a chooser — and the first half was simply wrong,
// as the tiles below show at exactly the size the child sees.
//
// The subjects here are the eight cabins, which the wall no longer renders; it shows the
// forty-four pursuits instead. The registers are what this page is for and they transfer.

// Three visual registers for the same three cabins, in real tiles at real tile size.
//
// Rendered side by side because that is the only way the question is answerable. Each register
// looks fine on its own; what matters is which one a nine-year-old's eye goes to first and whether
// that pull is about the topic or about the picture, and neither can be judged from a single image
// on a white background.
//
// The three subjects are chosen to span the difficulty rather than to flatter the styles. Chess is
// the easy case, a thing with an unmistakable silhouette. Plants sit between, and carry the extra
// risk of looking pretty in a way that has nothing to do with the work.
//
// Persuasion is the hard case and it turned out to be the informative one. There is no object that
// means it, so the minimal and flat registers both fall back on the same blank poster with speech
// bubbles, which says "someone is making something" and nothing more. Only the rendered register
// escaped, by shooting a page of handwriting: legible texture at tile size is a thing rendering can
// carry and the other two cannot, and a page of dense script says words in a way a blank sheet
// never does. The hardest subject is where the registers separate most.
const SUBJECTS = [
  { id: "games-strategy", label: "Games & Strategy" },
  { id: "science-nature", label: "Science & Nature" },
  { id: "influence-media", label: "Words & Persuasion" },
] as const;

const REGISTERS = [
  {
    key: "min",
    name: "Minimal",
    note: "Two colours, no shading, no depth. The most uniform of the three by construction: there is almost no execution left to vary, so almost none of the choice can be about it. Costs the most information — a symbol tells a child what the topic IS and nothing about what doing it feels like.",
    prefix: "min-",
  },
  {
    key: "flat",
    name: "Flat illustration",
    note: "The first attempt. Enough detail to show the activity and a fixed palette holding execution roughly level. Sits between the other two on both axes, which is the reason it was the first attempt rather than a considered choice.",
    prefix: "flat-",
  },
  {
    key: "real",
    name: "Rendered — shipped",
    note: "Materials, depth of field, real light. Carries by far the most information about what the activity is actually like, and gives appeal the most room to vary: texture and lighting are exactly where one image gets to be nicer than another. Shipped with that variance pinned in the prompt instead — one camera, one light, one palette, no flare or bokeh, a fixed prop count.",
    prefix: "real-",
  },
] as const;

export default function StylesPage(): JSX.Element {
  return (
    <main className="styles" data-mood="child">
      <header className="styles__head">
        <h1>Three registers, same three topics</h1>
        <p>
          At tile size, on the tile background, because none of this is judgeable from a single
          image on a white page. The question is not which is prettiest. It is which one a child
          picks <em>for the topic</em> rather than for the picture.
        </p>
      </header>

      {REGISTERS.map((r) => (
        <section key={r.key} className="styles__row">
          <div className="styles__meta">
            <h2>{r.name}</h2>
            <p>{r.note}</p>
          </div>
          <div className="styles__tiles">
            {SUBJECTS.map((s) => (
              <div className="tile styles__tile" key={s.id} data-cabin={s.id}>
                {/* Plain img: these are already WebP at render width, and the optimiser would
                    re-encode the very thing being compared. */}
                <img
                  className="tile__art"
                  src={`/topics/${r.prefix}${s.id}.webp`}
                  alt={`${s.label}, ${r.name} register`}
                  loading="lazy"
                />
                <span className="tile__label">{s.label}</span>
              </div>
            ))}
          </div>
        </section>
      ))}

      <footer className="styles__foot">
        <p>
          <strong>What to watch for.</strong> Uniformity is not the goal on its own — a set of tiles
          nobody wants to touch measures nothing. The goal is that the differences between tiles are
          about their <em>subjects</em>. So compare each row against itself: if one tile in a row
          pulls harder than the other two, ask whether it is the topic or the rendering, because
          whichever it is, the model will read it as interest either way.
        </p>
      </footer>
    </main>
  );
}
