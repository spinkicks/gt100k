"use client";

/**
 * The three things only an adult can tell us.
 *
 * Whether a child seems worn out, whether something with stakes is coming, and what they did away
 * from our screens. None of these can be read from behaviour, and until now nothing could produce
 * them, so two wellbeing states could never fire and the belief math's `external_report` had no
 * source at all.
 *
 * WHY THE WORDING IS WHAT IT IS. A single global question about a child's activity correlated
 * r = -0.11 with a week of objective measurement -- worse than nothing. The same parents reporting
 * a specific recent episode tracked it well. So this asks what they SAW and on which days, never
 * what the child is "interested in", because the second invites the inferential leap where halo and
 * stereotype enter and leaves nothing anyone can check later.
 *
 * WHY IT NEVER CONFIRMS. Nothing here tells the adult their report changed a belief, and nothing
 * they file changes what the child sees. Changing a parent's belief about their child causally
 * reallocates real investment, so a form that visibly moved a number would manufacture the
 * over-valuation the rest of this product exists to avoid.
 */
import { useState, type JSX } from "react";
import { MIN_SIGHTING_DAYS, type RestDirection, type StakesKind } from "@gt100k/adult-report";

const REST: readonly { readonly value: RestDirection; readonly label: string }[] = [
  { value: "seems-fine", label: "Seems fine" },
  { value: "flagging", label: "A bit flat lately" },
  { value: "worn-out", label: "Worn out by it" },
];

const KINDS: readonly { readonly value: StakesKind; readonly label: string }[] = [
  { value: "competition", label: "Competition" },
  { value: "performance", label: "Performance" },
  { value: "audition", label: "Audition" },
  { value: "assessment", label: "Exam or grading" },
  { value: "deadline", label: "Deadline" },
];

export function TellUsPanel({ kidName }: { kidName: string }): JSX.Element {
  const [saw, setSaw] = useState("");
  const [days, setDays] = useState("");
  const [filed, setFiled] = useState<string | null>(null);

  const dayCount = days.split(",").filter((d) => d.trim().length > 0).length;
  const enough = saw.trim().length > 0 && dayCount >= MIN_SIGHTING_DAYS;

  return (
    <section className="tellus" aria-label="Things only you can tell us">
      <p className="tellus__lede">
        Three things the console cannot see. None of them are guesses we can make from what
        {` ${kidName} `}
        does on screen.
      </p>

      <div className="tellus__block">
        <span className="planproject__k">Something you saw them do</span>
        <p className="tellus__hint">
          What they actually did, not what you think it means. Asking someone what a child is
          interested in turns out to be worse than not asking; asking what they saw last week works.
        </p>
        <label className="tellus__field">
          <span>What did you see?</span>
          <textarea
            rows={2}
            value={saw}
            onChange={(e) => setSaw(e.target.value)}
            placeholder="Kept setting the chessboard up after everyone had gone to bed"
          />
        </label>
        <label className="tellus__field">
          <span>Which days? (separate with commas)</span>
          <input
            value={days}
            onChange={(e) => setDays(e.target.value)}
            placeholder="Monday, Thursday"
          />
        </label>
        {/* Says why up front rather than refusing after they have typed. One afternoon is an
            afternoon; the thing worth recording is a habit. */}
        <p className="tellus__hint">
          We only count it if you saw it on more than one day.
          {dayCount === 1
            ? " One day still gets written down, it just does not count for much."
            : ""}
        </p>
        <button
          type="button"
          className="btn btn--ghost"
          disabled={!enough}
          onClick={() => {
            setFiled("Written down.");
            setSaw("");
            setDays("");
          }}
        >
          Add it
        </button>
        {/* Deliberately flat. It does not say "this strengthened chess", because an adult who can
            see their report move a number learns to file reports that move it. */}
        {filed === null ? null : <span className="tellus__done">{filed}</span>}
      </div>

      <div className="tellus__block">
        <span className="planproject__k">How are they holding up?</span>
        <p className="tellus__hint">
          Nobody can read this off a screen, and the honest version is a direction rather than a
          score. There is no threshold for this in any age group, so we do not pretend to one.
        </p>
        <div className="tellus__row">
          {REST.map((r) => (
            <button key={r.value} type="button" className="chip">
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="tellus__block">
        <span className="planproject__k">Anything big coming up?</span>
        <p className="tellus__hint">
          A date, not a feeling. If something matters to them this week, what we suggest changes:
          nothing new gets added beforehand, and afterwards the advice is to let them raise it
          first.
        </p>
        <div className="tellus__row">
          {KINDS.map((k) => (
            <button key={k.value} type="button" className="chip">
              {k.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
