/**
 * Tiny debug HUD (only when ?hud=1). Prints live stats from window.__cabin so a human can eyeball
 * fps / pose while walking. Never shown in shots (harness omits ?hud).
 */
import { useEffect, useState } from "react";

export function CameraRigHud(): JSX.Element {
  const [line, setLine] = useState("booting");
  useEffect(() => {
    const id = setInterval(() => {
      const s = window.__cabin?.stats;
      if (s)
        setLine(
          `${s.fps} fps · ${s.drawCalls} draws · ${s.triangles} tris · fire:${s.fireLit} cat:${s.catVisible}`,
        );
    }, 250);
    return () => clearInterval(id);
  }, []);
  return (
    <pre
      style={{
        position: "fixed",
        top: 8,
        left: 8,
        margin: 0,
        padding: "6px 8px",
        font: "12px/1.4 ui-monospace, Menlo, monospace",
        color: "#eaf2ff",
        background: "rgba(0,0,0,0.45)",
        borderRadius: 6,
        pointerEvents: "none",
      }}
    >
      {line}
      {"\nclick to look · WASD to move · E to interact"}
    </pre>
  );
}
