"use client";

// The reusable half of the game's old GadgetOverlay, lifted out of the map/cabin shell.
//
// In mvp-jul24 the overlay reached into a Zustand store (`useGame`, `useInterest`) and the signal
// log directly. Here it is a plain client component driven by props: the browse wall opens a game
// behind a subtopic and hands us the resolved gadget plus callbacks. Everything about *what a solve
// means for measurement* is pushed back to the caller via `onSolve` / `onHarder`, so this file
// stays a pure presentation host and the emission contract lives in one place (Phase 4).

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type JSX } from "react";
import type { Gadget } from "../game/types";
import ComingSoon from "../puzzles/ComingSoon";
// The cabin palette the ported games' CSS expects, scoped to the overlay so it cannot touch the
// wall. Loaded before PuzzleHost.css and every game stylesheet so the tokens exist when they resolve.
import "./theme-tokens.css";
import "./PuzzleHost.css";

export interface PuzzleHostProps {
  /** The resolved gadget to play — carries its `Puzzle` component and `supportsTier`. */
  gadget: Gadget;
  /** Leave the game and return to the wall. */
  onExit: () => void;
  /**
   * Fired once when the child leaves the game, with the time actually spent here in ms (time while
   * the tab was hidden is not counted). The caller turns this into an `open` record whose dwell
   * bucket tells the engine the child WAS present — which is what keeps a game a child opened but
   * did not solve from reading as a decline.
   */
  onOpen?: (gadgetId: string, activeMs: number) => void;
  /** Fired when the child solves. The caller decides what this emits (a work-mode action). */
  onSolve?: (gadgetId: string) => void;
  /** Fired when the child voluntarily asks for a harder board (`chosen_challenge`). */
  onHarder?: (gadgetId: string) => void;
}

export default function PuzzleHost({
  gadget,
  onExit,
  onOpen,
  onSolve,
  onHarder,
}: PuzzleHostProps): JSX.Element {
  const [solved, setSolved] = useState(false);
  const [tier, setTier] = useState(0);
  const reduce = useReducedMotion();

  // Presence tracking. We report the open exactly once, when the child leaves this game (unmount),
  // carrying the ACTIVE time — wall-clock minus any stretch the tab was hidden — so a child who
  // opened a puzzle and wandered off to another tab is not credited with a long engagement. The
  // latest `onOpen` is read through a ref so a new callback identity from the parent cannot retrigger
  // the mount-scoped effect and fire the open early.
  const onOpenRef = useRef(onOpen);
  onOpenRef.current = onOpen;
  useEffect(() => {
    const openedAt = Date.now();
    let hiddenMs = 0;
    let hiddenSince = document.visibilityState === "hidden" ? openedAt : null;
    const onVis = (): void => {
      if (document.visibilityState === "hidden") {
        hiddenSince = Date.now();
      } else if (hiddenSince !== null) {
        hiddenMs += Date.now() - hiddenSince;
        hiddenSince = null;
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      if (hiddenSince !== null) hiddenMs += Date.now() - hiddenSince;
      const activeMs = Math.max(0, Date.now() - openedAt - hiddenMs);
      onOpenRef.current?.(gadget.id, activeMs);
    };
  }, [gadget.id]);

  // Only offer a harder board where the component actually reads `tier` (see Gadget.supportsTier),
  // or "harder" would remount the puzzle to its own easy default — a board easier than the one just
  // solved.
  const offersHarder = !!gadget.supportsTier;

  return (
    <AnimatePresence>
      <motion.div
        key={gadget.id}
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
              onBack={onExit}
              onHarder={
                offersHarder
                  ? () => {
                      onHarder?.(gadget.id);
                      setTier((t) => t + 1);
                      setSolved(false);
                    }
                  : undefined
              }
            />
          ) : (
            <GadgetPuzzle
              gadget={gadget}
              tier={tier}
              onSolved={() => {
                onSolve?.(gadget.id);
                setSolved(true);
              }}
              onExit={onExit}
            />
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * The win state, and the one place a harder variant is OFFERED — when there is one to offer.
 * Nothing is gated (a completion gate would make "went deeper" a function of "solved it"), no
 * achievement copy, and no tier number: a quantified display of the child's own engagement is the
 * thing the surface refuses.
 */
function Solved({
  reduce,
  onBack,
  onHarder,
}: {
  reduce: boolean;
  onBack: () => void;
  onHarder?: () => void;
}): JSX.Element {
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
  gadget,
  tier,
  onSolved,
  onExit,
}: {
  gadget: Gadget;
  tier: number;
  onSolved: () => void;
  onExit: () => void;
}): JSX.Element {
  const Puzzle = gadget.status !== "coming-soon" ? gadget.Puzzle : undefined;
  const Component = Puzzle ?? ComingSoon;
  // Fresh seed each mount, so re-entering a game yields a different generated puzzle. Lazy init
  // via useState so the value is created once on the client, never at module load (SSR-safe).
  const [seed] = useState(() => Math.floor(Math.random() * 1_000_000_000));

  return <Component seed={seed} tier={tier} onSolved={onSolved} onExit={onExit} />;
}
