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
import { children, buildRosterGates, buildRosterStore, type Child } from "./console-data.js";
import { escalationCount, wellbeingForKid, type WellbeingCardVM } from "./wellbeing.js";
import { attentionFor, type Attention } from "./attention.js";
import { specPath } from "./vocab.js";
import { voluntaryReturns } from "./engagement.js";
import { familyForKid, familyObservationsForKid } from "./family.js";
import { plansForKid } from "./plan.js";
import { accessForKid } from "./access.js";

const GUIDE: HumanActor = { id: "guide-synthetic", role: "guide" };
const isoNow = (): string => new Date().toISOString();

export type Filter = "ALL" | string;

export interface ChildSummary {
  readonly tracked: number;
  // How many of this child's specializations are ready to promote right now: EMERGING with a passed
  // gate, the same rule `topPromotableId` and the attention verdict use -- NOT merely gate-passed. A
  // promoted card keeps its passed gate, so counting gate-passed left the roster saying "1 ready" for
  // a child with nothing left to promote, and beside a "Ready" verdict chip the word collided with
  // itself. Counting promotable drains the number the instant a promote lands.
  readonly promotableCount: number;
  readonly topState: string | null;
  readonly attention: Attention;
  // The card the guide's primary action would promote for THIS child, or null if none is promotable.
  // Carried per child (not just for the selected one) so the Today roster's Promote button can guard
  // itself the same way the action line does: `attention` reports a passed gate, but only this says
  // the store will actually let the promote through. See `topPromotableId` for the gap between them.
  readonly promotableId: string | null;
}

// Fold the three composed reads (wellbeing escalation, engagement fading, gate-ready) into one
// verdict. Kept here rather than in `attention.ts` so that module stays free of the domain
// view-model types and remains trivially unit-testable on plain inputs.
function attentionForKid(
  kidId: string,
  cards: readonly HypothesisCard[],
  wb: readonly WellbeingCardVM[],
): Attention {
  return attentionFor({
    wellbeing: wb.map((w) => ({
      id: w.id,
      state: w.read.state,
      escalateToHuman: w.read.escalateToHuman,
      domainPath: w.domainPath,
    })),
    cards: cards.map((c) => ({
      id: c.id,
      state: c.state,
      gatePassed: c.gate?.passed === true,
      // Carries the card's evidence sufficiency so the STEADY verdict can tell a settled-and-sure
      // child from a barely-observed one instead of calling both "Nothing needs you".
      confident: c.confident,
      domainPath: c.domainPath,
    })),
    fading: voluntaryReturns(kidId).fading,
  });
}

export function useConsole() {
  const [store, setStore] = useState<HypothesisStore>(() => buildRosterStore());
  // The decisions this browser has recorded. Held beside the store rather than derived from it,
  // because the store is the RESULT and the log is the record: see `decisions.ts` for why we
  // persist the second and replay it, instead of snapshotting the first.
  const [decisions, setDecisions] = useState<readonly GuideDecision[]>([]);
  const [kid, setKidRaw] = useState<string>(children()[0]!.id);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // The most recent human action, for the confirm-after-the-fact + undo affordance. A promote (or
  // park / contest / reopen) used to fire silently: the row simply changed, and a harried guide could
  // not tell their click had landed, let alone take it back -- and a consequential act with no
  // acknowledgement and no way back is exactly the kind a fat-finger commits. This names what just
  // happened and to whom; `undoLast` reverses it. Every recorded action appends exactly one decision,
  // so this always describes the log's last entry and `undoLast` always removes that same entry.
  const [lastAction, setLastAction] = useState<{
    readonly verb: string;
    readonly label: string;
    readonly child: string;
  } | null>(null);

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
    setLastAction(null);
  }

  /**
   * Take back the most recent recorded decision. The log is the record and the store is its result
   * (see decisions.ts: we persist the log and replay it, never a store snapshot), so dropping the
   * last entry and replaying the rest from the seed is the exact inverse of having recorded it -- no
   * separate "unpromote" transition to keep in step with the forward one. A no-op with nothing to
   * undo. Runs from an event handler, so reading `decisions` from the closure is current.
   */
  function undoLast(): void {
    if (decisions.length === 0) return;
    const next = decisions.slice(0, -1);
    try {
      if (next.length === 0) window.localStorage.removeItem(DECISIONS_KEY);
      else window.localStorage.setItem(DECISIONS_KEY, JSON.stringify(next));
    } catch {
      // Session-only from here; the in-memory rebuild below is still what the guide asked for.
    }
    setDecisions(next);
    setStore(applyDecisions(buildRosterStore(), next, buildRosterGates()).store);
    setLastAction(null);
  }

  /** Dismiss the confirmation without undoing -- the guide has seen it and moved on. */
  const clearLastAction = (): void => setLastAction(null);

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
    for (const child of children()) {
      const cvm = consoleViewModel(store, child.id, gates);
      const wb = wellbeingForKid(child.id);
      m.set(child.id, {
        tracked: cvm.cards.length,
        promotableCount: cvm.cards.filter((c) => c.state === "EMERGING" && c.gate?.passed === true)
          .length,
        topState: cvm.cards[0]?.state ?? null,
        attention: attentionForKid(child.id, cvm.cards, wb),
        promotableId: topPromotableId(store, child.id, gates),
      });
    }
    return m;
  }, [store, gates]);

  // The selected child's verdict, reusing the already-memoized view-model + wellbeing reads.
  const attention = useMemo(
    () => attentionForKid(kid, vm.cards, wellbeing),
    [kid, vm.cards, wellbeing],
  );

  const visible = filter === "ALL" ? vm.cards : vm.cards.filter((c) => c.state === filter);
  // With no explicit pick, default to the specialization the child's verdict names -- the escalating
  // wellbeing spike, or the gate-ready card -- rather than the top-ranked card. The wellbeing strip
  // and the scoped tabs read off this selection, so defaulting to an unrelated top card made the
  // strip calmly say "In the zone, leave as is" directly under a red "Needs you" banner about a
  // different spec, and buried the read that named the verdict behind a rail click. Landing on
  // `attention.specId` puts the reason for the alarm on screen without one. Falls back to the top
  // card when the verdict names nothing (Steady, or a whole-child fading read).
  const selectedCard: HypothesisCard | undefined =
    vm.cards.find((c) => c.id === selectedId) ??
    vm.cards.find((c) => c.id === attention.specId) ??
    vm.cards[0];

  const promotableId = topPromotableId(store, kid, gates);

  // Promote the primary card for ANY child, not only the selected one -- the Today roster acts on a
  // row without first switching to it. Returns the promoted card's id (so a caller can select it) or
  // null when the store refuses. Deliberately does not touch `kid` or `selectedId`: acting from the
  // roster leaves the guide on the roster.
  function promoteKid(kidId: string): string | null {
    const now = isoNow();
    const id = topPromotableId(store, kidId, gates);
    const next = applyGuidePrimaryAction(store, kidId, gates, now);
    if (next && id) {
      // Read the spec name off the pre-mutation store (where the card is still the one being
      // promoted) so the confirmation can say WHAT was promoted, not just that something was.
      const card = consoleViewModel(store, kidId, gates).cards.find((c) => c.id === id);
      record({ action: "promote", hypothesisId: id, at: now });
      setStore(next);
      setLastAction({
        verb: "Promoted",
        label: card ? specPath(card.domainPath) : "specialization",
        child: children().find((c) => c.id === kidId)?.name ?? "this child",
      });
      return id;
    }
    return null;
  }

  // The single-child console's primary action: promote this child's top card and select it, so the
  // detail pane lands on what just changed. Delegates to `promoteKid` so both paths share one rule.
  function advanceTop(): void {
    const id = promoteKid(kid);
    if (id) setSelectedId(id);
  }

  const PARK_REASON = "guide parked from console";
  const CONTEST_REASON = "guide contested from console";
  // Past-tense verb for the confirmation line, so it reads "Parked Chess" rather than echoing the raw
  // action token. Anything unmapped falls back to a neutral "Updated".
  const ACTION_VERB: Record<string, string> = {
    promote: "Promoted",
    park: "Parked",
    reopen: "Reopened",
    contest: "Contested",
  };

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
    // Same confirm-and-undo the roster's promote gets: a card action from the detail pane is just as
    // silent otherwise, and undo reverses whichever of these was last (they each record one decision).
    setLastAction({
      verb: ACTION_VERB[action] ?? "Updated",
      label: specPath(card.domainPath),
      child: children().find((c) => c.id === kid)?.name ?? "this child",
    });
  }

  // Promote from EMERGING requires a passed gate; CANDIDATE→ACTIVE does not. Disable the button when
  // the action would throw so the surface never lies about what is legal.
  function isDisabled(action: string, card: HypothesisCard): boolean {
    return action === "promote" && card.state === "EMERGING" && card.gate?.passed !== true;
  }

  const activeChild: Child | undefined = children().find((c) => c.id === kid);

  return {
    children: children(),
    // The live lifecycle store. Exposed so panels derived from certification (Plan, Access, Maps)
    // can read the guide's decisions rather than the module-scope seed.
    store,
    decisionCount: decisions.length,
    // The log itself, for the Family tab's coaching history. The count alone answers "have I done
    // anything"; the family conversation needs "what, and about which specialization".
    decisions,
    resetDecisions,
    // The last action's confirmation + the ways to resolve it: take it back, or acknowledge it.
    lastAction,
    undoLast,
    clearLastAction,
    kid,
    setKid,
    activeChild,
    vm,
    visible,
    filter,
    setFilter,
    counts,
    summaries,
    attention,
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
    promoteKid,
    runAction,
    isDisabled,
  };
}

export type ConsoleController = ReturnType<typeof useConsole>;
