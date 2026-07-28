import type { JSX } from "react";

import "../browse.css";
import "./styles.css";

// Three visual registers for the same three cabins, in real tiles at real tile size.
//
// Rendered side by side because that is the only way the question is answerable. Each register
// looks fine on its own; what matters is which one a nine-year-old's eye goes to first and whether
// that pull is about the topic or about the picture, and neither can be judged from a single image
// on a white background.
//
// The three subjects are chosen to span the difficulty rather than to flatter the styles. Chess is
// the easy case, a thing with an unmistakable silhouette. Persuasion is the hard case: there is no
// object that means it, so every register has to fall back on a person making a poster. Plants sit
// between, and carry the extra risk of looking pretty in a way that has nothing to do with the work.
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
    note: "The current build. Enough detail to show the activity and a fixed palette holding execution roughly level. Sits between the other two on both axes, which is the reason it was the first attempt rather than a considered choice.",
    prefix: "topic-",
  },
  {
    key: "real",
    name: "Rendered",
    note: "Materials, depth of field, cinematic light. Carries by far the most information about what the activity is actually like, and gives appeal the most room to vary: texture and lighting are exactly where one image gets to be nicer than another.",
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
