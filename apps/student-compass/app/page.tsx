"use client";

import {
  GT_CONFIG,
  SECTIONS,
  STANDARD_CONFIG,
  applyFocusedTime,
  evaluateGate,
  newDay,
  totalXp,
} from "@gt100k/learning-loop";
import type { DailyProgress, FocusedTimeSource, LoopConfig } from "@gt100k/learning-loop";
import { makeStubSource } from "@gt100k/timeback-stub";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Cohort = "standard" | "gt";
const CONFIGS: Record<Cohort, LoopConfig> = { standard: STANDARD_CONFIG, gt: GT_CONFIG };
const LEARNER = "synthetic-learner";
const DAY = "2026-07-20";
const SECTION_LABEL: Record<string, string> = {
  math: "Math",
  science: "Science",
  reading: "Reading",
  language: "Language",
};

export default function Page() {
  const [cohort, setCohort] = useState<Cohort>("standard");
  const config = CONFIGS[cohort];
  const [progress, setProgress] = useState<DailyProgress>(() => newDay(LEARNER, DAY, config));
  const [auto, setAuto] = useState(false);
  const [done, setDone] = useState(false);
  const sourceRef = useRef<FocusedTimeSource>(makeStubSource(config));

  const reset = useCallback((c: Cohort) => {
    setCohort(c);
    setProgress(newDay(LEARNER, DAY, CONFIGS[c]));
    sourceRef.current = makeStubSource(CONFIGS[c]);
    setDone(false);
    setAuto(false);
  }, []);

  const step = useCallback(async () => {
    const record = await sourceRef.current.next();
    if (record === null) {
      setDone(true);
      setAuto(false);
      return;
    }
    setProgress((p) => applyFocusedTime(p, record));
  }, []);

  useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => {
      void step();
    }, 250);
    return () => clearInterval(id);
  }, [auto, step]);

  const gate = useMemo(() => evaluateGate(progress), [progress]);
  const total = totalXp(progress.xpBySection);

  return (
    <main className="wrap">
      <header className="head">
        <div>
          <h1>Student Compass</h1>
          <p className="sub">Daily learning loop · synthetic learner · {DAY}</p>
        </div>
        <div className="cohort">
          {(["standard", "gt"] as Cohort[]).map((c) => (
            <button
              key={c}
              className={c === cohort ? "chip on" : "chip"}
              onClick={() => reset(c)}
              type="button"
            >
              {c === "standard" ? "Standard" : "GT"}
            </button>
          ))}
        </div>
      </header>

      <section className={progress.projectUnlocked ? "banner unlocked" : "banner locked"}>
        {progress.projectUnlocked ? (
          <>
            <span className="badge">Project time UNLOCKED</span>
            <span>Academic block complete — {total} XP earned.</span>
          </>
        ) : (
          <>
            <span className="badge">Project time locked</span>
            <span>
              {gate.remainingTotalXp} XP to the daily goal
              {gate.remainingTotalXp === 0 ? " · sections below floor still remaining" : ""}
            </span>
          </>
        )}
      </section>

      <div className="total">
        <div className="totalRow">
          <strong>Daily total</strong>
          <span>
            {total} / {progress.dailyGoalXp} XP
          </span>
        </div>
        <Bar value={total} max={progress.dailyGoalXp} tone="total" />
      </div>

      <section className="grid">
        {SECTIONS.map((s) => {
          const xp = progress.xpBySection[s];
          const goal = progress.sectionGoalXp[s];
          const floor = progress.sectionFloorXp[s];
          const beyond = gate.beyondFloorBySection[s];
          const floorMet = xp >= floor;
          return (
            <article key={s} className="card">
              <div className="cardHead">
                <span>{SECTION_LABEL[s]}</span>
                <span className={floorMet ? "ok" : "todo"}>
                  {floorMet ? "floor met" : "below floor"}
                </span>
              </div>
              <Bar
                value={xp}
                max={goal}
                tone={floorMet ? "ok" : "todo"}
                floorPct={(floor / goal) * 100}
              />
              <div className="cardFoot">
                <span>
                  {xp} / {goal} XP
                </span>
                {beyond > 0 ? <span className="signal">+{beyond} beyond floor</span> : <span />}
              </div>
            </article>
          );
        })}
      </section>

      <footer className="controls">
        <button type="button" className="btn" onClick={() => void step()} disabled={done}>
          Step
        </button>
        <button
          type="button"
          className="btn primary"
          onClick={() => setAuto((a) => !a)}
          disabled={done}
        >
          {auto ? "Pause" : "Auto-play"}
        </button>
        <button type="button" className="btn ghost" onClick={() => reset(cohort)}>
          Reset day
        </button>
        {done ? <span className="muted">Feed complete.</span> : null}
      </footer>

      <p className="note">
        Beyond-floor XP (the “+N” tags) is an early engagement signal — which sections a learner
        leans into once the requirement is met. Synthetic data; no consent/admissions/legal
        machinery.
      </p>
    </main>
  );
}

function Bar({
  value,
  max,
  tone,
  floorPct,
}: {
  value: number;
  max: number;
  tone: "total" | "ok" | "todo";
  floorPct?: number;
}) {
  const pct = Math.min(100, max === 0 ? 100 : (value / max) * 100);
  return (
    <div className="bar">
      <div className={`fill ${tone}`} style={{ width: `${pct}%` }} />
      {floorPct !== undefined ? <div className="floor" style={{ left: `${floorPct}%` }} /> : null}
    </div>
  );
}
