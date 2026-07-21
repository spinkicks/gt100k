import type { TurnAnalysis, TurnEvent } from "./model";

export interface RivalryMixThresholds {
  dominanceTurnShare: number;
  interruptionThreshold: number;
  confidenceFloor: number;
  minTurns: number;
  qualityFloor: number;
}

interface SpeakerSummary {
  turns: number;
  speakingTime: number;
  interruptions: number;
}

/** Computes observable turn-taking descriptors and confidence-gated patterns. */
export function analyzeTurns(
  turns: readonly TurnEvent[],
  thresholds: RivalryMixThresholds,
): TurnAnalysis {
  const summaries = new Map<string, SpeakerSummary>();
  let qualityTotal = 0;

  for (const turn of turns) {
    const summary = summaries.get(turn.speaker) ?? {
      turns: 0,
      speakingTime: 0,
      interruptions: 0,
    };
    const quality = turn.quality ?? 1;

    summary.turns += 1;
    summary.speakingTime += turn.duration;
    if (turn.overlap && quality >= thresholds.qualityFloor) {
      summary.interruptions += 1;
    }
    summaries.set(turn.speaker, summary);
    qualityTotal += quality;
  }

  const totalTurns = turns.length;
  const perSpeaker: TurnAnalysis["perSpeaker"] = {};
  const sortedSummaries = [...summaries.entries()].sort(([left], [right]) =>
    left.localeCompare(right),
  );

  for (const [speaker, summary] of sortedSummaries) {
    perSpeaker[speaker] = {
      turnShare: summary.turns / totalTurns,
      speakingTime: summary.speakingTime,
      interruptions: summary.interruptions,
    };
  }

  const meanQuality = totalTurns === 0 ? 0 : qualityTotal / totalTurns;
  const coverage = Math.min(1, totalTurns / thresholds.minTurns);
  const confidence = meanQuality * coverage;
  const suppressed = totalTurns < 2 || confidence < thresholds.confidenceFloor;
  const patterns: TurnAnalysis["patterns"] = [];

  if (!suppressed) {
    for (const [speaker, summary] of sortedSummaries) {
      const turnShare = summary.turns / totalTurns;
      if (turnShare > thresholds.dominanceTurnShare) {
        const sharePercent = (turnShare * 100).toFixed(1);
        const thresholdPercent = Number(
          (thresholds.dominanceTurnShare * 100).toFixed(1),
        ).toString();
        patterns.push({
          kind: "dominance",
          subjects: [speaker],
          evidence: `${speaker} holds ${summary.turns}/${totalTurns} turns (${sharePercent}%) > ${thresholdPercent}%`,
        });
      }
    }

    for (const [speaker, summary] of sortedSummaries) {
      if (summary.interruptions >= thresholds.interruptionThreshold) {
        patterns.push({
          kind: "repeated_interruption",
          subjects: [speaker],
          evidence: `${speaker} initiated ${summary.interruptions} overlapping turns ≥ ${thresholds.interruptionThreshold}`,
        });
      }
    }
  }

  return { perSpeaker, patterns, confidence, suppressed };
}
