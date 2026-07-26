/**
 * Reference-board harness: the three Logic Games boards, rendered by the app's own preview
 * components, at spec contrast, for the art pipeline to paint from.
 *
 * NOT PART OF THE APP BUNDLE. `vite build`'s only entry is index.html, so nothing here reaches
 * `dist` — same arrangement as `src/cabin/aliveness/harness.html`, and `tools/refboards.ts` asserts
 * it. Served in dev at
 *
 *     http://localhost:5178/src/cabin/backdrop/refboards/harness.html
 *
 * WHY A PAGE AND NOT A DIRECT SVG DUMP
 * Because the requirement is that the reference shows what **the app's renderer** draws, not what a
 * second implementation of the same board draws. `NonogramPreview` / `PipesPreview` / `MirrorPreview`
 * derive everything from the puzzles' own `logic.ts` — the powered set from `computePowered`, the beam
 * from `traceBeam`, the clue rails from `rowClues` — so rendering them in a real browser and
 * screenshotting the result is the only way to be sure the PNG cannot disagree with the app. Writing
 * an SVG by hand from the same data would be a third thing to keep in sync.
 *
 * WHAT MAKES THESE SPEC IMAGES RATHER THAN PRETTY ONES
 *   - full bleed: each board fills its box corner to corner, with no frame, margin, background or
 *     padding around it. The art agent fits a homography to the four corners of the PNG, so a margin
 *     would enter the painting as skew;
 *   - square boxes and square viewBoxes, so `preserveAspectRatio="xMidYMid meet"` letterboxes
 *     nothing and cells stay square;
 *   - the high-contrast palette below, overriding theme.css — the room's warm parchment-and-ember
 *     tokens are right on a firelit wall and wrong in a spec, where the only job is telling one
 *     symbol from another;
 *   - no `.cbd-preview` wrapper, which is what carries the contact `drop-shadow` in previews.css.
 *     A shadow baked into a reference gets painted, and then the painted board has two shadows.
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { PreviewFor } from "../previews/registry";
import "../previews/previews.css";
import { REF_BOARD_IDS, buildRefBoard, isMidState } from "./boards";
import "./harness.css";

const Harness: React.FC = () => (
  <>
    {REF_BOARD_IDS.map((id) => {
      const board = buildRefBoard(id);
      return (
        <section className="refboard" key={id} data-board={id} data-mid-state={isMidState(board)}>
          <PreviewFor snapshot={board.snapshot} />
        </section>
      );
    })}
  </>
);

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <Harness />
  </StrictMode>,
);
