/** Dev-only review harness. Not a build entry: vite's only entry is index.html, so this
 *  contributes zero bytes to dist. Sprite Loop is silent — there is no gesture to make first.
 *
 *  The solve counter is fine HERE and would not be in the puzzle: a harness is a developer tool, not
 *  a child surface, which is why Downbeat's harness has one too.
 */
import { useState } from "react";
import { createRoot } from "react-dom/client";
import SpriteLoop from "./SpriteLoop";
import { TIERS } from "./generate";
import "../../theme.css";

const LABELS = ["0 — short walk and turn", "1 — longer, may double back", "2 — timing matters"];

function Harness(): JSX.Element {
  const [seed, setSeed] = useState(7);
  const [tier, setTier] = useState(0);
  const [solves, setSolves] = useState(0);
  return (
    <div
      style={{
        fontFamily: "system-ui",
        color: "#f3e6cf",
        background: "#2a1c12",
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 12,
          padding: 12,
          alignItems: "center",
          flexWrap: "wrap",
          borderBottom: "1px solid #4a3524",
        }}
      >
        <label>
          seed{" "}
          <input
            type="number"
            value={seed}
            onChange={(e) => setSeed(Number(e.target.value))}
            style={{ width: 70 }}
          />
        </label>
        <button type="button" onClick={() => setSeed((s) => s + 1)}>
          next round
        </button>
        <span style={{ opacity: 0.6 }}>|</span>
        {TIERS.map((_, i) => (
          <button
            key={LABELS[i]}
            type="button"
            onClick={() => setTier(i)}
            style={{
              fontWeight: tier === i ? 700 : 400,
              background: tier === i ? "#e8863c" : undefined,
              color: tier === i ? "#2a1c12" : undefined,
            }}
          >
            {LABELS[i]}
          </button>
        ))}
        <span style={{ opacity: 0.7 }}>solved: {solves}</span>
      </div>
      <SpriteLoop
        key={`${seed}-${tier}`}
        seed={seed}
        tier={tier}
        onSolved={() => setSolves((n) => n + 1)}
        onExit={() => {}}
      />
    </div>
  );
}
createRoot(document.getElementById("root") as HTMLElement).render(<Harness />);
