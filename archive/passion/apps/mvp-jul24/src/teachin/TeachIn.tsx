/**
 * The one teach-in, shared by every activity. Mounted once per puzzle; owns every behaviour.
 *
 * WHY THIS EXISTS AT ALL, AND WHY IT STATES THE RULE INSTEAD OF ASKING QUESTIONS
 * ----------------------------------------------------------------------------------------------
 * This is direct instruction, not discovery, and the reason is a *negative* finding rather than a
 * preference. Chen & Klahr 1999 (N = 87) gave 7–10-year-olds probe questions — "why do you think
 * that?", "what would you try next?" — *without* direct instruction, and measured no improvement in
 * their ability to design unconfounded experiments or draw valid inferences. Explicit instruction
 * plus probes did produce learning, and it transferred. So "let the child figure out the rules" is
 * not the cautious option here; it is the option the evidence rules out. At the difficulty this app
 * targets (ages 9–12, gifted, PROJECT.md) it is also the option that converts difficulty into
 * guesswork, because a child who has not been told the rule cannot tell a hard inference from a
 * missing premise.
 *
 * Hence: the rule, in words, plainly, before the child touches anything — plus the same rule as a
 * labelled picture, because a second encoding costs nothing and lands faster for some readers.
 *
 * WHY IT DISMISSES ITSELF INSTEAD OF HAVING A CLOSE BUTTON
 * ----------------------------------------------------------------------------------------------
 * PROJECT.md's constraint is "dismisses on first interaction — it never blocks a child who already
 * gets it". A modal with a close button fails that twice over: it costs a click to leave, and the
 * click that leaves it is not the click the child wanted to make. So the panel is *not* modal. It is
 * `pointer-events: none` (see TeachIn.css), which means the very first touch lands on the board
 * *through* the panel — the cell gets clicked and the panel goes away in the same gesture. There is
 * nothing to close because there is nothing in the way.
 *
 * That also means this component must never trap focus, never render a backdrop, and never swallow
 * an event. The dismissal listeners below are all capture-phase and all side-effect-free: they set a
 * boolean and let the event continue to whatever it was aimed at.
 *
 * WHY ~20 SECONDS IS A CONSTRAINT AND NOT A STYLE NOTE
 * ----------------------------------------------------------------------------------------------
 * PROJECT.md cites a vigilance decrement detectable inside ~6 minutes at this age against activity
 * blocks of 10–15 minutes. A tutorial that takes a minute has eaten a tenth of the block and part of
 * the attention the activity was supposed to get. Two sentences and one small picture is the whole
 * budget; `rules.test.tsx` enforces the sentence and word ceilings so the budget cannot drift.
 *
 * WHAT IT DELIBERATELY HAS NOT GOT
 * ----------------------------------------------------------------------------------------------
 * No score, no points, no streak, no stars, no timer, and no progress of any kind (D7). Not even a
 * "1 of 3" step counter, which is the shape that tends to smuggle progress language into a tutorial.
 * The panel has one state — shown or not — and remembers nothing between visits.
 */
import { useCallback, useEffect, useId, useState } from "react";
import { TEACH_INS, type TeachInId } from "./rules";
import "./TeachIn.css";

export interface TeachInProps {
  /**
   * Which activity's rule to show. Typed as the union of `TEACH_INS`' keys, so mounting the teach-in
   * in a puzzle that has no rule written for it fails `pnpm typecheck` rather than rendering blank.
   */
  activity: TeachInId;
}

/**
 * Keys that mean "I am navigating, not playing". Tab and Shift+Tab move focus without touching the
 * activity, so a keyboard user gets to read the panel while walking to the controls; every other key
 * — Escape, Enter, Space, an arrow, a digit typed into Function Machine's prediction box — is an
 * interaction and dismisses.
 */
const NAVIGATION_KEYS = new Set(["Tab"]);

export default function TeachIn({ activity }: TeachInProps): JSX.Element {
  const { title, rule, Diagram } = TEACH_INS[activity];
  // Opens with the activity, every time. Nothing is persisted: a child who has played this ten times
  // pays one touch to dismiss it, and a child who has forgotten the rule does not have to hunt for a
  // setting to get it back. Persisting "already seen" would optimise the wrong side of that trade.
  const [shown, setShown] = useState(true);
  const panelId = `teachin-${useId()}`;

  const hide = useCallback(() => setShown(false), []);

  useEffect(() => {
    if (!shown) return;

    /**
     * Anything that starts inside the teach-in's own chrome — which is only ever the `?` button,
     * since the panel itself cannot be hit — is not "interacting with the activity", so it must not
     * dismiss. Without this the `?` would fight itself: the capture listener would close the panel a
     * moment before the button's own handler tried to toggle it.
     */
    const fromChrome = (target: EventTarget | null): boolean =>
      target instanceof Element && target.closest("[data-teachin-chrome]") !== null;

    const onPointer = (event: Event): void => {
      if (!fromChrome(event.target)) hide();
    };
    const onKey = (event: KeyboardEvent): void => {
      if (NAVIGATION_KEYS.has(event.key)) return;
      if (fromChrome(event.target) && event.key !== "Escape") return;
      hide();
    };

    // `pointerdown` is the real-browser path (earliest possible, so the panel is gone before the
    // board even repaints); `click` is here because it is the only one jsdom's fireEvent.click emits
    // and because a synthesised or assistive click never produces a pointer event at all.
    document.addEventListener("pointerdown", onPointer, true);
    document.addEventListener("click", onPointer, true);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("pointerdown", onPointer, true);
      document.removeEventListener("click", onPointer, true);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [shown, hide]);

  return (
    <div className="ti">
      {/* One box that both the `?` and the panel are positioned against, so the button lands on the
          panel's corner rather than somewhere inside its text — the panel is allowed to be wider than
          the activity it explains (see TeachIn.css), so "the activity's right edge" is the wrong
          reference for the button. */}
      <div className="ti-anchor">
        <button
          type="button"
          className="ti-help"
          data-teachin-chrome=""
          aria-expanded={shown}
          aria-controls={panelId}
          aria-label={shown ? `Hide how ${title} works` : `How ${title} works`}
          onClick={() => setShown((open) => !open)}
        >
          <span aria-hidden="true">?</span>
        </button>
        {shown ? (
          // `role="note"` rather than `dialog`: a dialog promises modality and focus management, and
          // this thing promises the opposite. The `?` button's aria-controls/aria-expanded pair is
          // what tells an assistive-technology user it is here and how to bring it back.
          <div className="ti-panel" id={panelId} role="note" aria-label={`How ${title} works`}>
            <p className="ti-rule">{rule}</p>
            <Diagram />
            {/*
              The one line of meta-text allowed, because it is the only way a child learns that the
              `?` exists. Not a sentence and not an instruction about the puzzle — a caption about the
              panel — so it stays outside the two-sentence rule budget.
            */}
            <p className="ti-caption">
              Touch the board to start · <span aria-hidden="true">?</span> brings this back
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
