import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { gadgetById } from "../gadgets/registry";
import { useGame } from "../game/store";
import { useInterest } from "../interest/store";
import ComingSoon from "../puzzles/ComingSoon";
import "./GadgetOverlay.css";

export default function GadgetOverlay() {
  const focusedGadgetId = useGame((s) => s.focusedGadgetId);
  const [solved, setSolved] = useState(false);

  useEffect(() => {
    setSolved(false);
    if (!focusedGadgetId) return;
    useInterest.getState().recordOpen(focusedGadgetId);
  }, [focusedGadgetId]);

  return (
    <AnimatePresence>
      {focusedGadgetId ? (
        <motion.div
          key={focusedGadgetId}
          className="gadget-overlay"
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.92, opacity: 0 }}
        >
          {solved ? (
            <div className="gadget-overlay-solved">
              <p className="gadget-overlay-solved-message">Solved!</p>
              <button
                type="button"
                className="gadget-overlay-solved-back"
                onClick={() => useGame.getState().closeGadget()}
              >
                ← Back
              </button>
            </div>
          ) : (
            <GadgetPuzzle id={focusedGadgetId} onSolved={() => setSolved(true)} />
          )}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function GadgetPuzzle({ id, onSolved }: { id: string; onSolved: () => void }) {
  const gadget = gadgetById(id);
  const Puzzle = gadget && gadget.status !== "coming-soon" ? gadget.Puzzle : undefined;
  const Component = Puzzle ?? ComingSoon;

  return (
    <Component
      seed={0}
      onSolved={() => {
        useInterest.getState().recordSolve(id);
        onSolved();
      }}
      onExit={() => useGame.getState().closeGadget()}
    />
  );
}
