import type { ProbeCardView } from "@gt100k/interest-lab-view";
import { QuestCard } from "./QuestCard";

export interface Board2DProps {
  quests: readonly ProbeCardView[];
  pickedProbeIds: readonly string[];
  onPick: (probeId: string) => void;
  onFocus?: (probeId: string) => void;
  touchTargetPx?: number;
}

const displayDomain = (domain: string) => domain.replaceAll("_", " ");

export function Board2D({ quests, pickedProbeIds, onPick, onFocus, touchTargetPx }: Board2DProps) {
  const groups = new Map<string, ProbeCardView[]>();
  for (const quest of quests) {
    groups.set(quest.domain, [...(groups.get(quest.domain) ?? []), quest]);
  }
  const picked = new Set(pickedProbeIds);
  const order = new Map(quests.map((quest, index) => [quest.probeId, index] as const));

  return (
    <div className="quest-board" aria-label="Quest card constellation board">
      {[...groups].map(([domain, domainQuests]) => (
        <section
          className="quest-constellation"
          key={domain}
          aria-label={`${displayDomain(domain)} constellation`}
        >
          <h3>
            <span style={{ background: domainQuests[0]?.domainHue }} aria-hidden="true" />
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
