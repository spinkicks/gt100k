"use client";

// The guide console — a calm, legible DATA console (not a game). It renders the pure
// `consoleViewModel` for a synthetic kid and lets a human promote / park / reopen / contest with the
// evidence in front of them. Supporting and disconfirming evidence are shown SEPARATELY (never summed
// into a scalar); language is "current evidence suggests… / next test is…", never "you are an X".
import { useEffect, useMemo, useRef, useState, type JSX } from "react";
import type { GateStatus, HumanActor, HypothesisStore } from "@gt100k/hypothesis-store";
import {
  consoleViewModel,
  contest,
  park,
  promote,
  reopen,
  type HypothesisCard,
} from "@gt100k/hypothesis-store";
import { applyGuidePrimaryAction, buildQaState } from "./console-state.js";
import { SEED_KID, buildSeedGates, buildSeedStore } from "./seed.js";
import { installQa } from "./qa.js";

// The synthetic human actor whose named authority every transition records. Real identity/authz is a
// platform concern (spec §2) — here it is a fixed synthetic guide.
const GUIDE: HumanActor = { id: "guide-synthetic", role: "guide" };

const isoNow = (): string => new Date().toISOString();

export default function Page(): JSX.Element {
  const [store, setStore] = useState<HypothesisStore>(() => buildSeedStore());
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const gates = useMemo(() => buildSeedGates(store), [store]);
  const vm = useMemo(() => consoleViewModel(store, SEED_KID, gates), [store, gates]);

  // Keep the latest store/selection/gates in a ref so the installed `window.__qa` never reads a stale
  // render closure — the harness's before/after `state()` diff must see CURRENT state.
  const ref = useRef({ store, selectedId, gates });
  ref.current = { store, selectedId, gates };

  useEffect(() => {
    installQa(
      () => buildQaState(ref.current.store, SEED_KID, ref.current.selectedId),
      () => {
        const next = applyGuidePrimaryAction(
          ref.current.store,
          SEED_KID,
          ref.current.gates,
          isoNow(),
        );
        if (next) setStore(next);
      },
    );
  }, []);

  function runAction(action: string, card: HypothesisCard): void {
    const now = isoNow();
    setSelectedId(card.id);
    try {
      if (action === "promote") {
        const gate: GateStatus = card.gate ?? {
          gapSurvived: false,
          durable: false,
          hasArtifact: false,
          passed: false,
        };
        setStore((s) => promote(s, card.id, GUIDE, { gate, autonomySignOff: true }, now));
      } else if (action === "park") {
        setStore((s) => park(s, card.id, GUIDE, "guide parked from console", now));
      } else if (action === "reopen") {
        setStore((s) => reopen(s, card.id, GUIDE, now));
      } else if (action === "contest") {
        setStore((s) => contest(s, card.id, GUIDE, "guide contested from console", now));
      }
    } catch {
      // A disabled/illegal action (e.g. promote before the gate passes) is a no-op — the button is
      // already disabled for these; the guard here keeps a stray click from throwing to the console.
    }
  }

  // Promote from EMERGING requires a passed gate; CANDIDATE→ACTIVE does not. Disable the button when
  // the action would throw so the surface never lies about what is legal.
  function isDisabled(action: string, card: HypothesisCard): boolean {
    return action === "promote" && card.state === "EMERGING" && card.gate?.passed !== true;
  }

  return (
    <main className="console" aria-labelledby="console-title">
      <header className="console__head">
        <h1 id="console-title">Guide console</h1>
        <p className="console__sub">
          Current evidence for <span className="mono">{SEED_KID}</span> — the system proposes, you
          dispose. Synthetic data only.
        </p>
        {vm.coverageGaps.length > 0 && (
          <p className="console__gaps">
            Coverage gaps (not yet sampled):{" "}
            {vm.coverageGaps.map((g) => (
              <span key={g} className="tag">
                {g}
              </span>
            ))}
          </p>
        )}
      </header>

      {vm.cards.length === 0 ? (
        <p className="console__empty" role="status">
          No hypotheses yet — exploration in progress.
        </p>
      ) : (
        <ul className="cards" aria-label="Interest hypotheses">
          {vm.cards.map((card) => (
            <li
              key={card.id}
              className={`card${selectedId === card.id ? " card--selected" : ""}`}
              aria-current={selectedId === card.id ? "true" : undefined}
            >
              <div className="card__top">
                <span className="card__cell">
                  {card.domainPath.join(" › ")} · <span className="mono">{card.mode}</span>
                </span>
                <span className={`state state--${card.state.toLowerCase()}`} data-state={card.state}>
                  <span aria-hidden="true">◆</span> {card.state}
                </span>
              </div>

              <p className="card__lb">
                Current evidence suggests a lower-bound of{" "}
                <span className="mono">{card.lowerBound.toFixed(2)}</span>
                {card.attribution ? ` (${card.attribution})` : ""}
                {card.confident ? " · calibrated" : " · still uncertain"}
              </p>

              <div className="card__evidence">
                <div className="ev ev--supporting">
                  <h3>Supporting</h3>
                  {card.supporting.length ? (
                    <ul>
                      {card.supporting.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="ev__none">none yet</p>
                  )}
                </div>
                <div className="ev ev--disconfirming">
                  <h3>Disconfirming</h3>
                  {card.disconfirming.length ? (
                    <ul>
                      {card.disconfirming.map((d) => (
                        <li key={d}>{d}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="ev__none">none yet</p>
                  )}
                </div>
              </div>

              <p className="card__probe">Next test is: {card.nextProbe}</p>

              <div className="card__actions" role="group" aria-label={`Actions for ${card.cellKey}`}>
                {card.allowedActions.map((action) => (
                  <button
                    key={action}
                    type="button"
                    className="btn"
                    disabled={isDisabled(action, card)}
                    onClick={() => runAction(action, card)}
                  >
                    {action}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
