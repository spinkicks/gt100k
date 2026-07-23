import type { ProbeCardView } from "@gt100k/interest-lab-view";
import { AnimatePresence, motion } from "motion/react";
import { Glyph, type GlyphName } from "../ui/Glyph";
import { resolveQuestCardMotion, toMotionEasing } from "./QuestCard";

export interface QuestTrayProps {
  quests: readonly ProbeCardView[];
  reducedMotion: boolean;
  onReturn: (probeId: string) => void;
}

export function QuestTray({ quests, reducedMotion, onReturn }: QuestTrayProps) {
  const pick = resolveQuestCardMotion(reducedMotion, 0).pick;
  const pickTransition = "ease" in pick ? { ...pick, ease: toMotionEasing(pick.ease) } : pick;

  return (
    <aside className="quest-tray" aria-labelledby="quest-tray-title">
      <div>
        <p className="surface-name">My quest tray</p>
        <h2 id="quest-tray-title">Keep a quest close</h2>
      </div>
      {quests.length === 0 ? (
        <p className="quest-tray-empty">
          Pick a quest to keep it close. You can put it back anytime.
        </p>
      ) : (
        <ol className="quest-tray-list" aria-live="polite">
          <AnimatePresence initial={false}>
            {quests.map((quest) => (
              <motion.li
                key={quest.probeId}
                data-quest-tray-item="true"
                initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.96 }}
                transition={pickTransition}
              >
                <Glyph name={quest.workModeGlyph as GlyphName} />
                <span>{quest.title}</span>
                <button
                  type="button"
                  aria-label={`Put ${quest.title} back on the board`}
                  onClick={() => onReturn(quest.probeId)}
                >
                  Put back
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ol>
      )}
    </aside>
  );
}
