import { SECTIONS } from "@gt100k/learning-loop";
import type {
  FocusedLearningRecord,
  FocusedTimeSource,
  LoopConfig,
  Section,
} from "@gt100k/learning-loop";

export interface StubOptions {
  learnerRef?: string;
  day?: string;
  /** Minutes per emitted record. */
  chunkMinutes?: number;
  /** A section that receives extra beyond-floor time, to exercise the engagement signal. */
  favorite?: Section;
  /** Extra chunks poured into `favorite` after the gate is satisfiable. */
  favoriteExtraChunks?: number;
}

/**
 * A deterministic stand-in for the real TimeBack feed. Given a cohort config, it produces a
 * finite, replayable sequence of FocusedLearningRecords that is guaranteed to satisfy the hybrid
 * gate (every section reaches its goal, so both the daily total and every floor are met), then
 * pours a few extra chunks into a "favorite" section so the beyond-floor engagement signal shows.
 *
 * Real TimeBack integration replaces this adapter without any change to the domain.
 */
export function makeStubSource(config: LoopConfig, opts: StubOptions = {}): FocusedTimeSource {
  const learnerRef = opts.learnerRef ?? "synthetic-learner";
  const day = opts.day ?? "2026-07-20";
  const chunk = opts.chunkMinutes ?? 10;
  const favorite = opts.favorite ?? "math";
  const favoriteExtra = opts.favoriteExtraChunks ?? 3;

  const queue: FocusedLearningRecord[] = [];
  // Round-robin chunks until each section has reached its goal (guarantees floor + total).
  const remaining: Record<Section, number> = { ...config.sectionGoalXp };
  let anyLeft = true;
  while (anyLeft) {
    anyLeft = false;
    for (const section of SECTIONS) {
      if (remaining[section] > 0) {
        const minutes = Math.min(chunk, remaining[section]);
        remaining[section] -= minutes;
        queue.push(makeRecord(queue.length, learnerRef, section, minutes, day));
        if (remaining[section] > 0) anyLeft = true;
      }
    }
  }
  // Extra engagement in the favorite section (beyond its floor/goal).
  for (let i = 0; i < favoriteExtra; i++) {
    queue.push(makeRecord(queue.length, learnerRef, favorite, chunk, day));
  }

  let idx = 0;
  return {
    next(): Promise<FocusedLearningRecord | null> {
      const record = queue[idx];
      idx += 1;
      return Promise.resolve(record ?? null);
    },
  };
}

function makeRecord(
  seq: number,
  learnerRef: string,
  section: Section,
  minutes: number,
  day: string,
): FocusedLearningRecord {
  // Deterministic increasing timestamps within the day (seq minutes past 09:00).
  const base = Date.parse(`${day}T09:00:00Z`);
  const occurredAt = new Date(base + seq * 60_000).toISOString();
  return { id: `stub-${seq}`, learnerRef, section, minutes, occurredAt };
}
