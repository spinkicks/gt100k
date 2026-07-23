/**
 * The coding-shack challenge overlay: a tiny editable PROGRAM that controls a real cabin gadget.
 * Generalizes the signal-lamp taste puzzle (TasteApp) — the player cycles typed op tokens on each
 * line and hits Run; every run drives the REAL 3D gadget live (via `onWorld`, which the shell wires
 * to the gadget store) so the lamp actually turns on/off behind the panel, and matching the target
 * locks the gadget "online". Never scored — it only emits behavioral signals for the hypothesis.
 */
import { useMemo, useRef, useState } from "react";
import type { ChallengeSpec, CodeLine } from "./challenges";
import { type InterestHypothesis, SignalRecorder } from "./signals";

function Lamp({ on }: { on: boolean }): JSX.Element {
  return (
    <span
      style={{
        display: "inline-block",
        width: 24,
        height: 24,
        borderRadius: "50%",
        margin: "0 4px",
        background: on ? "#ffcf6b" : "#2a2f3a",
        boxShadow: on ? "0 0 10px 2px rgba(255,190,90,0.8)" : "inset 0 0 4px #000",
        border: "1px solid rgba(255,255,255,0.15)",
      }}
    />
  );
}

export function CodeChallenge({
  spec,
  onWorld,
  onSolvedDiscovery,
  onClose,
}: {
  spec: ChallengeSpec;
  /** drive the real 3D gadget: called with the gadget store mode on every Run */
  onWorld: (mode: number) => void;
  /** called once, the first time this challenge is solved (breadth discovery signal) */
  onSolvedDiscovery: () => void;
  /** session end → depth hypothesis */
  onClose: (result: InterestHypothesis) => void;
}): JSX.Element {
  const recorder = useMemo(() => new SignalRecorder(Date.now()), []);
  const [lines, setLines] = useState<CodeLine[]>(() => spec.lines.map((l) => ({ ...l })));
  const [result, setResult] = useState<number[] | null>(null);
  const [runs, setRuns] = useState(0);
  const [solved, setSolved] = useState(false);
  const closed = useRef(false);

  const cycle = (i: number): void => {
    if (solved) return;
    recorder.edit();
    setLines((prev) =>
      prev.map((l, j) => (j === i ? { ...l, op: (l.op + 1) % spec.ops.length } : l)),
    );
  };

  const run = (): void => {
    const trace = spec.run(lines);
    const ok = trace.length === spec.target.length && trace.every((v, i) => v === spec.target[i]);
    recorder.run(Date.now(), ok);
    setResult(trace);
    setRuns((r) => r + 1);
    onWorld(spec.worldMode(trace, ok)); // drive the real gadget live
    if (ok && !solved) {
      setSolved(true);
      onSolvedDiscovery();
    }
  };

  const close = (): void => {
    if (closed.current) return;
    closed.current = true;
    onClose(recorder.end(Date.now()));
  };

  const mono = '13px/1.7 "SF Mono", ui-monospace, "Cascadia Code", Menlo, monospace';

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "grid",
        placeItems: "center",
        // low-opacity so the player watches the real gadget change behind the panel on each Run
        background: "rgba(6,8,12,0.5)",
        backdropFilter: "blur(1.5px)",
        zIndex: 20,
      }}
    >
      <div
        style={{
          width: 460,
          maxWidth: "92vw",
          padding: "22px 24px",
          borderRadius: 14,
          background: "linear-gradient(180deg,#1b1f27,#12151b)",
          border: "1px solid rgba(255,180,110,0.25)",
          color: "#eae2d6",
          font: "14px/1.5 ui-sans-serif, system-ui, sans-serif",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <h2 style={{ margin: 0, font: "600 17px ui-sans-serif, system-ui" }}>{spec.title}</h2>
          <button type="button" onClick={close} style={btn("ghost")}>
            ✕
          </button>
        </div>
        <p style={{ color: "#b6ad9e", marginTop: 6 }}>{spec.prompt}</p>

        <div style={{ margin: "12px 0 6px", color: "#9fb0c8" }}>Target</div>
        <div>
          {spec.target.map((v, i) => (
            <Lamp key={`t-${spec.gadgetId}-${i}`} on={v === 1} />
          ))}
        </div>

        {/* the program — monospace so it reads as code; each line's op is an editable token */}
        <div
          style={{
            margin: "14px 0 6px",
            padding: "12px 14px",
            borderRadius: 10,
            background: "#0d1016",
            border: "1px solid rgba(255,255,255,0.07)",
            font: mono,
            color: "#cfd6e2",
          }}
        >
          <div style={{ color: "#7f8ba0" }}>{spec.header}</div>
          {lines.map((l, i) => (
            <div key={`ln-${spec.gadgetId}-${l.pre}`} style={{ whiteSpace: "pre" }}>
              {"  "}
              <span style={{ color: "#9aa4b6" }}>{l.pre}</span>
              <button type="button" onClick={() => cycle(i)} style={opTok(spec.ops[l.op]!, solved)}>
                {spec.ops[l.op]}
              </button>
              {l.post ? <span style={{ color: "#9aa4b6" }}>{l.post}</span> : null}
            </div>
          ))}
          <div style={{ color: "#7f8ba0" }}>{spec.footer}</div>
        </div>

        {result && (
          <>
            <div style={{ margin: "12px 0 6px", color: "#9fb0c8" }}>Output</div>
            <div>
              {result.map((v, i) => (
                <Lamp key={`r-${spec.gadgetId}-${i}`} on={v === 1} />
              ))}
            </div>
          </>
        )}

        <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 18 }}>
          {!solved ? (
            <button type="button" onClick={run} style={btn("primary")}>
              ▶ Run
            </button>
          ) : (
            <button type="button" onClick={close} style={btn("primary")}>
              ✓ Online — back to the shack
            </button>
          )}
          <span style={{ color: solved ? "#8fd19e" : "#b6ad9e" }}>
            {solved
              ? spec.solvedMsg
              : runs > 0
                ? "Not quite — tweak an op and run again."
                : "Cycle the ops, then Run."}
          </span>
        </div>
      </div>
    </div>
  );
}

function btn(kind: "primary" | "ghost"): React.CSSProperties {
  if (kind === "ghost")
    return {
      background: "transparent",
      color: "#b6ad9e",
      border: "none",
      cursor: "pointer",
      fontSize: 16,
    };
  return {
    background: "linear-gradient(180deg,#ff9a3c,#e8791f)",
    color: "#20140a",
    border: "none",
    borderRadius: 9,
    padding: "9px 16px",
    fontWeight: 600,
    cursor: "pointer",
  };
}

function opTok(op: string, solved: boolean): React.CSSProperties {
  const flip = op === "FLIP";
  return {
    background: flip ? "rgba(255,160,80,0.18)" : "rgba(120,150,200,0.16)",
    color: flip ? "#ffcf9a" : "#a9c2e6",
    border: `1px solid ${flip ? "rgba(255,160,80,0.5)" : "rgba(120,150,200,0.45)"}`,
    borderRadius: 7,
    padding: "1px 8px",
    fontWeight: 700,
    fontFamily: "inherit",
    cursor: solved ? "default" : "pointer",
  };
}
