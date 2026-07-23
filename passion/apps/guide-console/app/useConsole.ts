"use client";

// Shared controller for every prototype: owns the roster store, the selected child, the lifecycle
// filter, the selected card, the human actions, and the `window.__qa` install. Keeping this in one
// place means all four prototypes render the exact same behaviour and only differ in presentation.
import { useEffect, useMemo, useRef, useState } from "react";
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
import { installQa } from "./qa.js";
import { CHILDREN, buildRosterGates, buildRosterStore, type Child } from "./console-data.js";

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
  const [kid, setKidRaw] = useState<string>(CHILDREN[0]!.id);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const gates = useMemo(() => buildRosterGates(store), [store]);
  const vm = useMemo(() => consoleViewModel(store, kid, gates), [store, kid, gates]);

  // Switching child resets the transient view state so the detail pane / filter never point at a
  // stale card from the previous kid.
  function setKid(id: string): void {
    setKidRaw(id);
    setSelectedId(null);
    setFilter("ALL");
  }

  const ref = useRef({ store, kid, selectedId, gates });
  ref.current = { store, kid, selectedId, gates };

  useEffect(() => {
    installQa(
      () => buildQaState(ref.current.store, ref.current.kid, ref.current.selectedId),
      () => {
        const next = applyGuidePrimaryAction(
          ref.current.store,
          ref.current.kid,
          ref.current.gates,
          isoNow(),
        );
        if (next) setStore(next);
      },
    );
  }, []);

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
    const next = applyGuidePrimaryAction(store, kid, gates, isoNow());
    if (next) {
      if (promotableId) setSelectedId(promotableId);
      setStore(next);
    }
  }

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
      // Illegal/disabled action (e.g. promote before the gate passes) is a no-op — the button is
      // already disabled for these; this guard just keeps a stray click from throwing.
    }
  }

  // Promote from EMERGING requires a passed gate; CANDIDATE→ACTIVE does not. Disable the button when
  // the action would throw so the surface never lies about what is legal.
  function isDisabled(action: string, card: HypothesisCard): boolean {
    return action === "promote" && card.state === "EMERGING" && card.gate?.passed !== true;
  }

  const activeChild: Child | undefined = CHILDREN.find((c) => c.id === kid);

  return {
    children: CHILDREN,
    kid,
    setKid,
    activeChild,
    vm,
    visible,
    filter,
    setFilter,
    counts,
    summaries,
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
