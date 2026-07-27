"use client";

// Shared controller for every prototype: owns the roster store, the selected child, the lifecycle
// filter, the selected card, the human actions, and the `window.__qa` install. Keeping this in one
// place means all four prototypes render the exact same behaviour and only differ in presentation.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GateStatus, HumanActor, HypothesisStore } from "@gt100k/hypothesis-store";
import {
  consoleViewModel,
  contest,
  park,
  promote,
  reopen,
  type HypothesisCard,
} from "@gt100k/hypothesis-store";
import { applyGuidePrimaryAction, buildQaState, topPromotableId } from "./console-state.js";
import {
  applyDecisions,
  DECISIONS_KEY,
  parseDecisionLog,
  type GuideDecision,
} from "./decisions.js";
import { installQa } from "./qa.js";
import { CHILDREN, buildRosterGates, buildRosterStore, type Child } from "./console-data.js";
import { escalationCount, wellbeingForKid } from "./wellbeing.js";
import { familyForKid, familyObservationsForKid } from "./family.js";
import { plansForKid } from "./plan.js";
import { accessForKid } from "./access.js";

const GUIDE: HumanActor = { id: "guide-synthetic", role: "guide" };
const isoNow = (): string => new Date().toISOString();

export type Filter = "ALL" | string;

export interface ChildSummary {
  readonly tracked: number;
  readonly gateReady: number;
  readonly topState: string | null;
}

export function useConsole() {
  const [store, setStore] = useState<HypothesisStore>(() => buildRosterStore());
  // The decisions this browser has recorded. Held beside the store rather than derived from it,
  // because the store is the RESULT and the log is the record: see `decisions.ts` for why we
  // persist the second and replay it, instead of snapshotting the first.
  const [decisions, setDecisions] = useState<readonly GuideDecision[]>([]);
  const [kid, setKidRaw] = useState<string>(CHILDREN[0]!.id);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const gates = useMemo(() => buildRosterGates(store), [store]);
  const vm = useMemo(() => consoleViewModel(store, kid, gates), [store, kid, gates]);
  // The selected child's per-spike wellbeing reads (016) — derived from the interaction log, not the
  // mutable store, so a human promote/park never changes them.
  const wellbeing = useMemo(() => wellbeingForKid(kid), [kid]);
  // The selected child's family coaching read (021) + its synthetic guide observations.
  const family = useMemo(() => familyForKid(kid), [kid]);
  const familyObservations = useMemo(() => familyObservationsForKid(kid), [kid]);
  // The selected child's certified-spike specialization plans (018-D1). Derived from the log + the
  // same wellbeing reads, with the DETERMINISTIC STUB brief — synchronous + offline for LOOP_QA.
  const plans = useMemo(() => plansForKid(kid, store), [kid, store]);
  // The selected child's per-certified-spike access broker plans (023-D3/D4). Same plans + wellbeing
  // reads, run through the pure brokerAccess engine against a synthetic opportunity catalog.
  const access = useMemo(() => accessForKid(kid, store), [kid, store]);

  // Switching child resets the transient view state so the detail pane / filter never point at a
  // stale card from the previous kid.
  function setKid(id: string): void {
    setKidRaw(id);
    setSelectedId(null);
    setFilter("ALL");
  }

  // Load after mount, never during render: reading storage while rendering would make the server
  // and client markup disagree, and this is a client-only fact about one browser.
  useEffect(() => {
    const log = parseDecisionLog(window.localStorage.getItem(DECISIONS_KEY));
    if (log.length === 0) return;
    setDecisions(log);
    setStore(applyDecisions(buildRosterStore(), log, buildRosterGates()).store);
  }, []);

  /**
   * Append one decision and write the log. Writing can throw (private mode, quota), and when it
   * does the decision still applies to this session: losing persistence is worse than losing the
   * action, and pretending the click did not happen would be the wrong failure.
   */
  const record = useCallback((decision: GuideDecision): void => {
    setDecisions((prev) => {
      const next = [...prev, decision];
      try {
        window.localStorage.setItem(DECISIONS_KEY, JSON.stringify(next));
      } catch {
        // Session-only from here. The console still behaves; it just will not survive a reload.
      }
      return next;
    });
    // Stable: the only thing it closes over is a setState, so the QA effect below can depend on it
    // without reinstalling the contract on every render.
  }, []);

  /** Forget every recorded decision and return the roster to its seeded state. */
  function resetDecisions(): void {
    try {
      window.localStorage.removeItem(DECISIONS_KEY);
    } catch {
      // Nothing to do: the in-memory reset below is what the guide asked for either way.
    }
    setDecisions([]);
    setStore(buildRosterStore());
    setSelectedId(null);
  }

  const ref = useRef({ store, kid, selectedId, gates });
  ref.current = { store, kid, selectedId, gates };

  useEffect(() => {
    installQa(
      () =>
        buildQaState(
          ref.current.store,
          ref.current.kid,
          ref.current.selectedId,
          escalationCount(ref.current.kid),
        ),
      () => {
        const now = isoNow();
        const id = topPromotableId(ref.current.store, ref.current.kid, ref.current.gates);
        const next = applyGuidePrimaryAction(
          ref.current.store,
          ref.current.kid,
          ref.current.gates,
          now,
        );
        if (next && id) {
          record({ action: "promote", hypothesisId: id, at: now });
          setStore(next);
        }
      },
    );
  }, [record]);

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of vm.cards) m.set(c.state, (m.get(c.state) ?? 0) + 1);
    return m;
  }, [vm.cards]);

  // Per-child summaries for the switcher (tracked count, how many are gate-ready, the top state).
  const summaries = useMemo(() => {
    const m = new Map<string, ChildSummary>();
    for (const child of CHILDREN) {
      const cvm = consoleViewModel(store, child.id, gates);
      m.set(child.id, {
        tracked: cvm.cards.length,
        gateReady: cvm.cards.filter((c) => c.gate?.passed === true).length,
        topState: cvm.cards[0]?.state ?? null,
      });
    }
    return m;
  }, [store, gates]);

  const visible = filter === "ALL" ? vm.cards : vm.cards.filter((c) => c.state === filter);
  const selectedCard: HypothesisCard | undefined =
    vm.cards.find((c) => c.id === selectedId) ?? vm.cards[0];

  const promotableId = topPromotableId(store, kid, gates);

  function advanceTop(): void {
    const now = isoNow();
    const next = applyGuidePrimaryAction(store, kid, gates, now);
    if (next && promotableId) {
      setSelectedId(promotableId);
      record({ action: "promote", hypothesisId: promotableId, at: now });
      setStore(next);
    }
  }

  const PARK_REASON = "guide parked from console";
  const CONTEST_REASON = "guide contested from console";

  function runAction(action: string, card: HypothesisCard): void {
    const now = isoNow();
    setSelectedId(card.id);
    // Computed eagerly rather than inside a `setStore` updater. The updater runs during the later
    // render, so a throw from it would escape this try entirely and surface as a render error; the
    // guard only works if the transition is attempted here. It also means a refused action records
    // nothing, which is the property that keeps the log replayable.
    let next: HypothesisStore;
    try {
      if (action === "promote") {
        const gate: GateStatus = card.gate ?? {
          gapSurvived: false,
          durable: false,
          hasArtifact: false,
          passed: false,
        };
        next = promote(store, card.id, GUIDE, { gate, autonomySignOff: true }, now);
      } else if (action === "park") {
        next = park(store, card.id, GUIDE, PARK_REASON, now);
      } else if (action === "reopen") {
        next = reopen(store, card.id, GUIDE, now);
      } else if (action === "contest") {
        next = contest(store, card.id, GUIDE, CONTEST_REASON, now);
      } else {
        return;
      }
    } catch {
      // Illegal/disabled action (e.g. promote before the gate passes) is a no-op — the button is
      // already disabled for these; this guard just keeps a stray click from throwing.
      return;
    }

    const reason =
      action === "park" ? PARK_REASON : action === "contest" ? CONTEST_REASON : undefined;
    record({
      action: action as GuideDecision["action"],
      hypothesisId: card.id,
      at: now,
      ...(reason === undefined ? {} : { reason }),
    });
    setStore(next);
  }

  // Promote from EMERGING requires a passed gate; CANDIDATE→ACTIVE does not. Disable the button when
  // the action would throw so the surface never lies about what is legal.
  function isDisabled(action: string, card: HypothesisCard): boolean {
    return action === "promote" && card.state === "EMERGING" && card.gate?.passed !== true;
  }

  const activeChild: Child | undefined = CHILDREN.find((c) => c.id === kid);

  return {
    children: CHILDREN,
    // The live lifecycle store. Exposed so panels derived from certification (Plan, Access, Maps)
    // can read the guide's decisions rather than the module-scope seed.
    store,
    decisionCount: decisions.length,
    resetDecisions,
    kid,
    setKid,
    activeChild,
    vm,
    visible,
    filter,
    setFilter,
    counts,
    summaries,
    wellbeing,
    family,
    familyObservations,
    plans,
    access,
    selectedId,
    setSelectedId,
    selectedCard,
    promotableId,
    advanceTop,
    runAction,
    isDisabled,
  };
}

export type ConsoleController = ReturnType<typeof useConsole>;
