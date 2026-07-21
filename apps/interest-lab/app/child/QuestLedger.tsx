"use client";

import type { ProbeCardView, ProbePickerView } from "@gt100k/interest-lab-view";
import { LayoutGroup } from "motion/react";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";
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
  onFocusQuest?: (probeId: string) => void;
  onPickQuest?: (probeId: string) => void;
  onPickedProbeIdsChange?: (probeIds: readonly string[]) => void;
}

export function QuestLedger({
  picker,
  onFocusQuest,
  onPickQuest,
  onPickedProbeIdsChange,
}: QuestLedgerProps) {
  const [pickedProbeIds, dispatch] = useReducer(updatePickedProbeIds, []);
  const [focusedProbeId, setFocusedProbeId] = useState<string | null>(null);
  const pickedProbeIdsChangeRef = useRef(onPickedProbeIdsChange);
  const questById = useMemo(
    () => new Map(picker.quests.map((quest) => [quest.probeId, quest] as const)),
    [picker.quests],
  );
  const pickedQuests = pickedProbeIds
    .map((probeId) => questById.get(probeId))
    .filter((quest): quest is ProbeCardView => quest !== undefined);
  const reducedMotion = picker.quests[0]?.motion.mode === "reduced";

  useEffect(() => {
    pickedProbeIdsChangeRef.current = onPickedProbeIdsChange;
  }, [onPickedProbeIdsChange]);

  useEffect(() => pickedProbeIdsChangeRef.current?.(pickedProbeIds), [pickedProbeIds]);

  const pick = (probeId: string) => {
    dispatch({ type: pickedProbeIds.includes(probeId) ? "return" : "pick", probeId });
    if (!pickedProbeIds.includes(probeId)) onPickQuest?.(probeId);
  };
  const focus = (probeId: string) => {
    setFocusedProbeId(probeId);
    onFocusQuest?.(probeId);
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
        <QuestTray
          quests={pickedQuests}
          reducedMotion={reducedMotion}
          onReturn={(probeId) => dispatch({ type: "return", probeId })}
        />
      </LayoutGroup>
    </section>
  );
}
