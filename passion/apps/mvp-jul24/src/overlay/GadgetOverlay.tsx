import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { gadgetById } from "../gadgets/registry";
import { useGame } from "../game/store";
import { useInterest } from "../interest/store";
import ComingSoon from "../puzzles/ComingSoon";
import { FLOOR_MS } from "../signals/log";
import { sessionLog } from "../signals/session";
import "./GadgetOverlay.css";

export default function GadgetOverlay() {
  const focusedGadgetId = useGame((s) => s.focusedGadgetId);
  const [solved, setSolved] = useState(false);
  const [tier, setTier] = useState(0);
  const reduce = useReducedMotion();
  // Whether *this* gadget's component actually honours `tier` (see `Gadget.supportsTier`). Only
  // Nonogram does today; the offer must stay hidden for the other eight, whose own round state
  // would otherwise reset to easy on remount and hand back a board easier than the one just solved.
  const offersHarder = !!(focusedGadgetId && gadgetById(focusedGadgetId)?.supportsTier);

  useEffect(() => {
    setSolved(false);
    setTier(0);
    if (!focusedGadgetId) return;
    const id = focusedGadgetId;
    useInterest.getState().recordOpen(id);

    // Snapshot at open so the emitted event reflects *this* visit, not the
    // gadget's lifetime total.
    const before = useInterest.getState().byGadget[id];
    const activeAtOpen = before?.activeMs ?? 0;
    const solvesAtOpen = before?.solves ?? 0;

    return () => {
      const activeMs = (useInterest.getState().byGadget[id]?.activeMs ?? 0) - activeAtOpen;
      sessionLog.recordOpen(id, activeMs);
      // Returning to something already solved is unrequired revision — the
      // puzzle owed them nothing. Gated on the same floor so a misclick on a
      // finished gadget is not read as depth.
      if (activeMs >= FLOOR_MS && solvesAtOpen > 0) {
        sessionLog.recordDepth(id, "unrequired_revision");
      }
    };
  }, [focusedGadgetId]);

  return (
    <AnimatePresence>
      {focusedGadgetId ? (
        <motion.div
          key={focusedGadgetId}
          className="gadget-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          <motion.div
            className="gadget-overlay-panel"
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 8 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
          >
            {solved ? (
              <Solved
                reduce={!!reduce}
                onBack={() => useGame.getState().closeGadget()}
                onHarder={
                  offersHarder
                    ? () => {
                        setTier((t) => t + 1);
                        setSolved(false);
                      }
                    : undefined
                }
              />
            ) : (
              <GadgetPuzzle id={focusedGadgetId} tier={tier} onSolved={() => setSolved(true)} />
            )}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

/**
 * The win state, and the one shared place a harder variant is OFFERED — when there is one to
 * offer. `onHarder` is OPTIONAL: the overlay omits it for any gadget without `supportsTier`, so the
 * button only appears where a harder board is actually backed by the puzzle. Where it does appear,
 * both buttons are present and neither is preferred — nothing is gated (see shelf/types.ts for why
 * — a completion gate would make "went deeper" a deterministic function of "solved it", and
 * `solves` indexes prior ability), and the harder board is a choice the child makes rather than an
 * escalation the app performs. No achievement copy, and no tier number: §11 refuses a quantified
 * display of the child's own engagement. Where the offer is absent, nothing was withheld either —
 * there was never a harder variant to withhold.
 */
function Solved({
  reduce,
  onBack,
  onHarder,
}: {
  reduce: boolean;
  onBack: () => void;
  onHarder?: () => void;
}) {
  const confetti = ["--ember", "--ember-bright", "--ember-deep", "--parchment-edge"];
  return (
    <div className="gadget-overlay-solved">
      {!reduce ? (
        <div className="gadget-overlay-confetti" aria-hidden="true">
          {Array.from({ length: 14 }).map((_, i) => (
            <motion.span
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed decorative burst, never reordered.
              key={i}
              className="gadget-overlay-confetti-bit"
              style={{
                left: `${8 + (i * 84) / 13}%`,
                background: `var(${confetti[i % confetti.length]})`,
              }}
              initial={{ y: -10, opacity: 0, scale: 0.6 }}
              animate={{ y: [-10, 120], opacity: [0, 1, 0], rotate: [0, 220] }}
              transition={{ duration: 1.1, delay: i * 0.04, ease: "easeOut" }}
            />
          ))}
        </div>
      ) : null}
      <motion.div
        className="gadget-overlay-star"
        aria-hidden="true"
        initial={reduce ? { opacity: 1 } : { scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 12, delay: 0.05 }}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path
            d="M12 2.5l2.7 5.7 6.3.8-4.6 4.3 1.2 6.2L12 16.9 6.4 19.7l1.2-6.2-4.6-4.3 6.3-.8z"
            fill="var(--ember-bright)"
            stroke="var(--ember-deep)"
            strokeWidth="1"
            strokeLinejoin="round"
          />
        </svg>
      </motion.div>
      <p className="gadget-overlay-solved-message">Solved!</p>
      <p className="gadget-overlay-solved-sub">Nicely done — that one's in your book.</p>
      <button type="button" className="gadget-overlay-solved-back" onClick={onBack}>
        ← Back
      </button>
      {onHarder ? (
        <button type="button" className="gadget-overlay-solved-harder" onClick={onHarder}>
          Try a harder one
        </button>
      ) : null}
    </div>
  );
}

function GadgetPuzzle({
  id,
  tier,
  onSolved,
}: {
  id: string;
  tier: number;
  onSolved: () => void;
}) {
  const gadget = gadgetById(id);
  const Puzzle = gadget && gadget.status !== "coming-soon" ? gadget.Puzzle : undefined;
  const Component = Puzzle ?? ComingSoon;
  // Fresh seed each time a gadget is opened (this component remounts per open
  // via the overlay's key), so re-entering a gadget yields a different
  // generated puzzle — not just the "Next puzzle" button.
  const [seed] = useState(() => Math.floor(Math.random() * 1_000_000_000));

  return (
    <Component
      seed={seed}
      tier={tier}
      onSolved={() => {
        useInterest.getState().recordSolve(id);
        onSolved();
      }}
      onExit={() => useGame.getState().closeGadget()}
    />
  );
}
