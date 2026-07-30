/**
 * All twelve teach-ins on one page, so the set can be reviewed as a set.
 *
 * It exists because three of the twelve — Logic Grid, LITS, Minesweeper — are off the activity roster
 * (src/gadgets/registry.ts) and therefore unreachable in the running app, so their panels could rot
 * unseen. It is also the only view in which "do these twelve read as one component?" is answerable at
 * all; one at a time, twelve slightly different sketches all look fine.
 *
 * Not part of the app bundle — `vite build`'s only entry is index.html. Served in dev at
 *
 *     http://localhost:5178/src/teachin/harness.html
 *
 * Each slot reproduces a puzzle root's layout (column flex, centred items, a gap), because the panel
 * positions itself against that and nothing else.
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import TeachIn from "./TeachIn";
import { TEACH_INS, type TeachInId } from "./rules";
import "../theme.css";

const IDS = Object.keys(TEACH_INS) as TeachInId[];

function Harness() {
  return (
    <div className="harness">
      {IDS.map((id) => (
        <div className="harness-slot" key={id}>
          <span className="harness-id">{id}</span>
          <TeachIn activity={id} />
        </div>
      ))}
    </div>
  );
}

const container = document.getElementById("root");
if (container) {
  createRoot(container).render(
    <StrictMode>
      <Harness />
    </StrictMode>,
  );
}
