/** Dev-only review harness. Not a build entry: vite's only entry is index.html, so this
 *  contributes zero bytes to dist.
 *
 *  This is where Tune Repair is played until the music room has art and the gadget can be registered
 *  (see docs/superpowers/specs/2026-07-27-music-cabin-design.md §4). Sound needs a click first —
 *  browsers suspend an AudioContext created without a gesture — so press Play, not Reload.
 *
 *  The tier buttons exist because difficulty is the open question on this activity. A session
 *  normally cycles tiers by round (tierForIndex), so pinning one is a harness-only affordance for
 *  comparing them back to back.
 */
import { useState } from "react";
import { createRoot } from "react-dom/client";
import TuneRepair from "./TuneRepair";
import { TIERS } from "./generate";
import "../../theme.css";

const LABELS = ["0 — easiest: runs only, slow", "1 — adds the arch", "2 — hardest: all shapes"];

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
          next tune
        </button>
        <span style={{ opacity: 0.6 }}>|</span>
        {TIERS.map((t, i) => (
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
        <span style={{ opacity: 0.7 }}>
          {TIERS[tier]?.length} notes · {TIERS[tier]?.bpm} bpm
        </span>
        <span style={{ opacity: 0.7 }}>solved: {solves}</span>
      </div>
      <TuneRepair
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
