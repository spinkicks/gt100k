/**
 * The Code cabin's "first taste": a tiny debug puzzle. A workshop signal-lamp runs a 4-step program
 * of FLIP / HOLD gates starting from OFF; the child edits the gates so the lamp's pattern matches the
 * target filmstrip — i.e. debugs the broken contraption. Low-floor, hands-on, and instrumented.
 *
 * It is never scored or graded (PRD: chat/taste is never scored). It only emits behavioral signals
 * through the SignalRecorder, which the shell folds into a revisable InterestHypothesis.
 */
import { useMemo, useRef, useState } from "react";
import { type InterestHypothesis, SignalRecorder } from "./signals";

type Gate = "FLIP" | "HOLD";
interface Step {
  id: string;
  gate: Gate;
}

// Target pattern the lamp must produce (steps 1..4), and a deliberately-broken starting program.
const TARGET: Array<{ id: string; on: boolean }> = [
  { id: "s1", on: true },
  { id: "s2", on: true },
  { id: "s3", on: false },
  { id: "s4", on: true },
];
const BROKEN: Step[] = [
  { id: "s1", gate: "HOLD" },
  { id: "s2", gate: "FLIP" },
  { id: "s3", gate: "HOLD" },
  { id: "s4", gate: "HOLD" },
];

/** Run the program from OFF, returning the lamp state after each step. */
function simulate(steps: Step[]): boolean[] {
  const out: boolean[] = [];
  let on = false;
  for (const s of steps) {
    if (s.gate === "FLIP") on = !on;
    out.push(on);
  }
  return out;
}

function Lamp({ on }: { on: boolean }): JSX.Element {
  return (
    <span
      style={{
        display: "inline-block",
        width: 26,
        height: 26,
        borderRadius: "50%",
        margin: "0 4px",
        background: on ? "#ffcf6b" : "#2a2f3a",
        boxShadow: on ? "0 0 10px 2px rgba(255,190,90,0.8)" : "inset 0 0 4px #000",
        border: "1px solid rgba(255,255,255,0.15)",
      }}
    />
  );
}

export function TasteApp({
  onClose,
}: {
  onClose: (result: InterestHypothesis) => void;
}): JSX.Element {
  const recorder = useMemo(() => new SignalRecorder(Date.now()), []);
  const [steps, setSteps] = useState<Step[]>(() => BROKEN.map((s) => ({ ...s })));
  const [result, setResult] = useState<Array<{ id: string; on: boolean }> | null>(null);
  const [runs, setRuns] = useState(0);
  const [solved, setSolved] = useState(false);
  const closed = useRef(false);

  const toggle = (id: string): void => {
    if (solved) return;
    recorder.edit();
    setSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, gate: s.gate === "FLIP" ? "HOLD" : "FLIP" } : s)),
    );
  };

  const run = (): void => {
    const out = simulate(steps);
    const ok = out.every((v, i) => v === TARGET[i]?.on);
    recorder.run(Date.now(), ok);
    setResult(steps.map((s, i) => ({ id: s.id, on: out[i] ?? false })));
    setRuns((r) => r + 1);
    if (ok) setSolved(true);
  };

  const close = (): void => {
    if (closed.current) return;
    closed.current = true;
    onClose(recorder.end(Date.now()));
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "grid",
        placeItems: "center",
        background: "rgba(6,8,12,0.6)",
        backdropFilter: "blur(2px)",
        zIndex: 20,
      }}
    >
      <div
        style={{
          width: 440,
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
          <h2 style={{ margin: 0, font: "600 17px ui-sans-serif, system-ui" }}>
            Signal Lamp — fix the program
          </h2>
          <button type="button" onClick={close} style={btn("ghost")}>
            ✕
          </button>
        </div>
        <p style={{ color: "#b6ad9e", marginTop: 6 }}>
          The lamp starts <b>off</b>. Each gate <b>FLIP</b>s or <b>HOLD</b>s it. Make the lamp match
          the target.
        </p>

        <div style={{ margin: "14px 0 6px", color: "#9fb0c8" }}>Target</div>
        <div>
          {TARGET.map((t) => (
            <Lamp key={`t-${t.id}`} on={t.on} />
          ))}
        </div>

        <div style={{ margin: "16px 0 6px", color: "#9fb0c8" }}>Your program</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {steps.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => toggle(s.id)}
              style={gateBtn(s.gate, solved)}
            >
              {i + 1}. {s.gate}
            </button>
          ))}
        </div>

        {result && (
          <>
            <div style={{ margin: "16px 0 6px", color: "#9fb0c8" }}>Result</div>
            <div>
              {result.map((r) => (
                <Lamp key={`r-${r.id}`} on={r.on} />
              ))}
            </div>
          </>
        )}

        <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 20 }}>
          {!solved ? (
            <button type="button" onClick={run} style={btn("primary")}>
              ▶ Run
            </button>
          ) : (
            <button type="button" onClick={close} style={btn("primary")}>
              Nice — leave the workshop
            </button>
          )}
          <span style={{ color: solved ? "#8fd19e" : "#b6ad9e" }}>
            {solved
              ? "Solved! The lamp matches."
              : runs > 0
                ? "Not quite — tweak a gate and run again."
                : `runs: ${runs}`}
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

function gateBtn(g: Gate, solved: boolean): React.CSSProperties {
  return {
    background: g === "FLIP" ? "rgba(255,160,80,0.18)" : "rgba(120,150,200,0.16)",
    color: g === "FLIP" ? "#ffcf9a" : "#a9c2e6",
    border: `1px solid ${g === "FLIP" ? "rgba(255,160,80,0.5)" : "rgba(120,150,200,0.45)"}`,
    borderRadius: 9,
    padding: "9px 12px",
    fontWeight: 600,
    cursor: solved ? "default" : "pointer",
    minWidth: 84,
  };
}
