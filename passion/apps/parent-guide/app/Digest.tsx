"use client";

/**
 * The month, in the child's own words.
 *
 * This is what a parent gets instead of a dashboard, and the shape is the argument. There is no
 * number here a parent can watch move, nothing to compare against, and no trend. See
 * `docs/decisions/2026-08-04-what-can-be-sensed.md` §5 for why each of those is refused, and
 * `@gt100k/family`'s `digest.ts` for the reasoning in the engine.
 *
 * WHAT THE CHILD SEES FIRST. The line at the bottom is not decoration. Everything here is something
 * the child chose to send, and they saw exactly this page before it existed. What a parent knows
 * about their child comes overwhelmingly from the child telling them rather than from any watching,
 * and children who feel their privacy invaded disclose less a year later, so the disclosure channel
 * outperforms the surveillance one on its own terms.
 */
import type { JSX } from "react";
import { parentDigest, type InterestPhase, type TheirWords } from "@gt100k/family";

/**
 * Synthetic, and labelled as such on screen.
 *
 * There is no real child in this system. When there is, these come from what the child sent, never
 * from a derived quantity.
 */
const WORDS: readonly TheirWords[] = [
  {
    about: "getting the drum loop to stop sounding stiff",
    said: "I nudged everything off the grid a tiny bit and it finally sounded human",
    on: "2026-07-20",
  },
  {
    about: "the bass drowning everything out",
    said: "I turned it down until you could hear the hi-hat again",
    on: "2026-07-28",
  },
];

const PHASE: InterestPhase = "growing";

export function Digest(): JSX.Element {
  const d = parentDigest({ kidId: "pilot-child", covering: "July", words: WORDS, phase: PHASE });

  return (
    <section className="digest" aria-labelledby="digest-h">
      <h2 id="digest-h">What they said this month</h2>

      {d.words.length === 0 ? (
        <p className="digest__none">
          They did not send anything this month. That is theirs to decide, and it is not a sign of
          anything on its own.
        </p>
      ) : (
        <ul className="digest__words">
          {d.words.map((w) => (
            <li key={w.on}>
              <p className="digest__said">&ldquo;{w.said}&rdquo;</p>
              <p className="digest__about">on {w.about}</p>
            </li>
          ))}
        </ul>
      )}

      {/* One suggestion, and the reason for it. A parent following a script is not present; a
          parent who knows why they are going first can improvise. */}
      <div className={`digest__one${d.leaveItAlone ? " digest__one--quiet" : ""}`}>
        <p className="digest__k">One thing to try</p>
        <p className="digest__say">{d.oneThing.say}</p>
        <p className="digest__because">{d.oneThing.because}</p>
      </div>

      <p className="digest__consent">
        Your child chose what appears here and saw this page before you did. They can hold anything
        back, and they do not have to say why.
      </p>
    </section>
  );
}
