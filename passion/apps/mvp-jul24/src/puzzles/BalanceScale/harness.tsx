/** Dev-only review harness. Not a build entry: vite's only entry is index.html, so this
 *  contributes zero bytes to dist (asserted in BalanceScale.test.tsx's sibling checks). */
import { useState } from "react";
import { createRoot } from "react-dom/client";
import BalanceScale from "./BalanceScale";
import "../../theme.css";

function Harness(): JSX.Element {
  const [seed, setSeed] = useState(1);
  const [round, setRound] = useState(0);
  return (
    <div style={{ fontFamily: "system-ui", color: "#f3e6cf" }}>
      <div style={{ display: "flex", gap: 12, padding: 12, alignItems: "center" }}>
        <label>
          seed{" "}
          <input type="number" value={seed} onChange={(e) => setSeed(Number(e.target.value))} />
        </label>
        <button type="button" onClick={() => setRound((r) => r + 1)}>
          tier toggle (round {round})
        </button>
      </div>
      <BalanceScale
        key={`${seed}-${round}`}
        seed={seed}
        initialRound={round}
        onSolved={() => {}}
        onExit={() => {}}
      />
    </div>
  );
}
createRoot(document.getElementById("root") as HTMLElement).render(<Harness />);
