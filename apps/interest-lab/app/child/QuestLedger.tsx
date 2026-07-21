"use client";

import type { ProbeCardView, ProbePickerView } from "@gt100k/interest-lab-view";
import { LayoutGroup } from "motion/react";
import { useMemo, useReducer, useState } from "react";
import { Board2D } from "./Board2D";
import { QuestTray } from "./QuestTray";

type PickAction = { type: "pick" | "return"; probeId: string };

export function updatePickedProbeIds(current: string[], action: PickAction): string[] {
  if (action.type === "return") {
    return current.filter((probeId) => probeId !== action.probeId);
  }
  return current.includes(action.probeId) ? current : [...current, action.probeId];
}

export interface QuestLedgerProps {
  picker: ProbePickerView;
  /**
   * Shared pick state, when the ledger is driven by a parent (QuestWorld) so the 3D
   * orbs and the DOM cards toggle the SAME reducer. Omit to run standalone (the ledger
   * then owns its own pick/focus state — used by lightweight render tests).
   */
  pickedProbeIds?: readonly string[];
  focusedProbeId?: string | null;
  /** Toggle a quest into/out of the tray (card click or 3D orb click). */
  onTogglePick?: (probeId: string) => void;
  /** Explicitly remove a quest from the tray (tray "try a different way"). */
  onReturn?: (probeId: string) => void;
  /** Focus a quest's island (card focus/hover). */
  onFocus?: (probeId: string) => void;
}

export function QuestLedger({
  picker,
  pickedProbeIds: controlledPickedProbeIds,
  focusedProbeId: controlledFocusedProbeId,
  onTogglePick,
  onReturn,
  onFocus,
}: QuestLedgerProps) {
  const [internalPickedProbeIds, dispatch] = useReducer(updatePickedProbeIds, []);
  const [internalFocusedProbeId, setInternalFocusedProbeId] = useState<string | null>(null);
  const controlled = controlledPickedProbeIds !== undefined;
  const pickedProbeIds = controlledPickedProbeIds ?? internalPickedProbeIds;
  const focusedProbeId = controlled ? (controlledFocusedProbeId ?? null) : internalFocusedProbeId;

  const questById = useMemo(
    () => new Map(picker.quests.map((quest) => [quest.probeId, quest] as const)),
    [picker.quests],
  );
  const pickedQuests = pickedProbeIds
    .map((probeId) => questById.get(probeId))
    .filter((quest): quest is ProbeCardView => quest !== undefined);
  const reducedMotion = picker.quests[0]?.motion.mode === "reduced";

  const pick = (probeId: string) => {
    if (controlled) {
      onTogglePick?.(probeId);
      return;
    }
    dispatch({ type: internalPickedProbeIds.includes(probeId) ? "return" : "pick", probeId });
  };
  const returnQuest = (probeId: string) => {
    if (controlled) {
      onReturn?.(probeId);
      return;
    }
    dispatch({ type: "return", probeId });
  };
  const focus = (probeId: string) => {
    if (controlled) {
      onFocus?.(probeId);
      return;
    }
    setInternalFocusedProbeId(probeId);
  };

  return (
    <section
      className="quest-ledger"
      aria-labelledby="quest-ledger-title"
      data-focused-probe={focusedProbeId ?? undefined}
    >
      <div className="quest-ledger-intro">
        <div>
          <p className="surface-name">Choose what to try</p>
          <h2 id="quest-ledger-title">Your quest constellation</h2>
        </div>
        <p>There is no best choice, and asking for another way never counts against you.</p>
      </div>
      <LayoutGroup id="interest-lab-quest-picks">
        <Board2D
          quests={picker.visibleQuests}
          pickedProbeIds={pickedProbeIds}
          onPick={pick}
          onFocus={focus}
          touchTargetPx={picker.staging.touchTargetPx}
        />
        <QuestTray quests={pickedQuests} reducedMotion={reducedMotion} onReturn={returnQuest} />
      </LayoutGroup>
    </section>
  );
}
