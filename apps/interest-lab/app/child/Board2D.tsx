import type { ProbeCardView } from "@gt100k/interest-lab-view";
import type { CSSProperties, KeyboardEventHandler } from "react";
import { QuestCard } from "./QuestCard";

export interface Board2DProps {
  quests: readonly ProbeCardView[];
  pickedProbeIds: readonly string[];
  onPick: (probeId: string) => void;
  onFocus?: (probeId: string) => void;
  touchTargetPx?: number;
}

const displayDomain = (domain: string) => domain.replaceAll("_", " ");

const QUEST_FOCUS_KEYS = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"] as const;
type QuestFocusKey = (typeof QUEST_FOCUS_KEYS)[number];

export function nextQuestFocusIndex(
  currentIndex: number,
  key: string,
  questCount: number,
): number | null {
  if (
    questCount <= 0 ||
    currentIndex < 0 ||
    currentIndex >= questCount ||
    !QUEST_FOCUS_KEYS.includes(key as QuestFocusKey)
  ) {
    return null;
  }

  const direction = key === "ArrowRight" || key === "ArrowDown" ? 1 : -1;
  return (currentIndex + direction + questCount) % questCount;
}

export function Board2D({ quests, pickedProbeIds, onPick, onFocus, touchTargetPx }: Board2DProps) {
  const groups = new Map<string, ProbeCardView[]>();
  for (const quest of quests) {
    groups.set(quest.domain, [...(groups.get(quest.domain) ?? []), quest]);
  }
  const picked = new Set(pickedProbeIds);
  const order = new Map(quests.map((quest, index) => [quest.probeId, index] as const));
  const moveQuestFocus: KeyboardEventHandler<HTMLDivElement> = (event) => {
    const cards = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>('[data-quest-card="true"]'),
    );
    const nextIndex = nextQuestFocusIndex(
      cards.indexOf(event.target as HTMLButtonElement),
      event.key,
      cards.length,
    );
    if (nextIndex === null) return;

    event.preventDefault();
    cards[nextIndex]?.focus();
  };

  return (
    <div
      className="quest-board"
      aria-label="Quest card constellation board"
      onKeyDown={moveQuestFocus}
    >
      {[...groups].map(([domain, domainQuests]) => (
        <section
          className="quest-constellation"
          key={domain}
          aria-label={`${displayDomain(domain)} constellation`}
        >
          <h3>
            <span
              style={{ "--domain-hue": domainQuests[0]?.domainHue } as CSSProperties}
              aria-hidden="true"
            />
            {displayDomain(domain)}
          </h3>
          <ol className="quest-card-list">
            {domainQuests.map((quest) => (
              <li key={quest.probeId}>
                <QuestCard
                  quest={quest}
                  index={order.get(quest.probeId) ?? 0}
                  picked={picked.has(quest.probeId)}
                  onPick={onPick}
                  onFocus={() => onFocus?.(quest.probeId)}
                  touchTargetPx={touchTargetPx}
                />
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
