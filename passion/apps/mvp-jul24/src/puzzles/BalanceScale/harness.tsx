/** Dev-only review harness. Not a build entry: vite's only entry is index.html, so this
 *  contributes zero bytes to dist (asserted in BalanceScale.test.tsx's sibling checks).
 *
 *  IT MOUNTS THE REAL SURFACE, and that is the whole point of the file. The previous version rendered
 *  the puzzle straight onto a dark page, while the app renders every puzzle inside
 *  `.gadget-overlay-panel` — which is parchment. So the one screenshot anybody ever looked at was of a
 *  surface the app does not have, and a puzzle whose text was cream-on-parchment (1.02:1, reported as
 *  "white on white") looked fine in review. A harness that does not reproduce the real background
 *  cannot catch a contrast bug, so this one imports the overlay's own stylesheet and reuses its class
 *  rather than approximating it. */
import { useState } from "react";
import { createRoot } from "react-dom/client";
import BalanceScale from "./BalanceScale";
import "../../theme.css";
import "../../overlay/GadgetOverlay.css";

function Harness(): JSX.Element {
  const [seed, setSeed] = useState(1);
  const [round, setRound] = useState(0);
  const [tier, setTier] = useState(0);
  return (
    <div className="gadget-overlay">
      <div>
        <div
          style={{
            display: "flex",
            gap: 12,
            padding: 12,
            alignItems: "center",
            color: "var(--cream)",
            fontFamily: "var(--font-body)",
          }}
        >
          <label>
            seed{" "}
            <input type="number" value={seed} onChange={(e) => setSeed(Number(e.target.value))} />
          </label>
          <label>
            tier{" "}
            <input
              type="number"
              min={0}
              value={tier}
              onChange={(e) => setTier(Number(e.target.value))}
            />
          </label>
          <button type="button" onClick={() => setRound((r) => r + 1)}>
            round ramp (round {round})
          </button>
        </div>
        <div className="gadget-overlay-panel">
          <BalanceScale
            key={`${seed}-${round}-${tier}`}
            seed={seed}
            tier={tier}
            initialRound={round}
            onSolved={() => {}}
            onExit={() => {}}
          />
        </div>
      </div>
    </div>
  );
}
createRoot(document.getElementById("root") as HTMLElement).render(<Harness />);
