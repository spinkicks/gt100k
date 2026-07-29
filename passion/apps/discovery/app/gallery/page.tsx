"use client";

// INTERNAL QA ONLY — not a child-facing surface and not linked from the wall.
// A flat gallery to mount each ported game standalone and confirm it renders and solves. Removed at
// cutover (Phase 5). It exists so Phase 2 has an exit criterion independent of the merged view.

import { useState, type JSX } from "react";
import { GADGETS } from "../../runtime/gadgets/registry";
import PuzzleHost from "../../runtime/host/PuzzleHost";

export default function GalleryPage(): JSX.Element {
  const [openId, setOpenId] = useState<string | null>(null);
  const gadget = GADGETS.find((g) => g.id === openId) ?? null;

  return (
    <main style={{ padding: "2rem", fontFamily: "var(--font-sans)" }}>
      <h1>Game gallery (QA)</h1>
      <p>{GADGETS.length} gadgets registered. Click one to mount it.</p>
      <ul style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", listStyle: "none", padding: 0 }}>
        {GADGETS.map((g) => (
          <li key={g.id}>
            <button
              type="button"
              onClick={() => setOpenId(g.id)}
              style={{ minHeight: 56, padding: "0.5rem 1rem", cursor: "pointer" }}
            >
              {g.label} <small>({g.topic})</small>
            </button>
          </li>
        ))}
      </ul>
      {gadget ? (
        <PuzzleHost
          gadget={gadget}
          onExit={() => setOpenId(null)}
          onSolve={(id) => console.log("solved", id)}
          onHarder={(id) => console.log("harder", id)}
        />
      ) : null}
    </main>
  );
}
