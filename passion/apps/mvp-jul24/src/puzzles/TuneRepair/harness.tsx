/** Dev-only review harness. Not a build entry: vite's only entry is index.html, so this
 *  contributes zero bytes to dist.
 *
 *  This is where Tune Repair is actually played until the music room has art and the gadget can be
 *  registered (see docs/superpowers/specs/2026-07-27-music-cabin-design.md §4). Sound needs a click
 *  first — browsers suspend an AudioContext created without a gesture — so press Play, not Reload.
 */
import { useState } from "react";
import { createRoot } from "react-dom/client";
import TuneRepair from "./TuneRepair";
import "../../theme.css";

function Harness(): JSX.Element {
  const [seed, setSeed] = useState(7);
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
      <div style={{ display: "flex", gap: 12, padding: 12, alignItems: "center" }}>
        <label>
          seed{" "}
          <input type="number" value={seed} onChange={(e) => setSeed(Number(e.target.value))} />
        </label>
        <button type="button" onClick={() => setSeed((s) => s + 1)}>
          next seed
        </button>
        <span style={{ opacity: 0.7 }}>solved this session: {solves}</span>
      </div>
      <TuneRepair
        key={seed}
        seed={seed}
        onSolved={() => setSolves((n) => n + 1)}
        onExit={() => {}}
      />
    </div>
  );
}
createRoot(document.getElementById("root") as HTMLElement).render(<Harness />);
