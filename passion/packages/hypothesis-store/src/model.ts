// The revisable InterestHypothesis record + supporting types (spec §3.2).
import type { Attribution, DomainPath } from "@gt100k/interest-inference";
import type { Lifecycle } from "./lifecycle.js";

export interface HumanActor {
  readonly id: string;
  readonly role: string; // role !== "MODEL"/"SYSTEM" (enforced by actions)
}

export interface HistoryEntry {
  readonly at: string;
  readonly from: Lifecycle;
  readonly to: Lifecycle;
  readonly actor: string;
  readonly reason: string;
}

export interface HypothesisEvidence {
  readonly mean: number;
  readonly lowerBound: number;
  readonly confident: boolean;
  readonly attribution: Attribution | null;
  readonly supporting: readonly string[];
  readonly disconfirming: readonly string[];
  // sticky: true once lowerBound ≥ SPIKE_THRESHOLD (drives CONTESTED detection on a later drop)
  readonly wasAboveThreshold: boolean;
}

export interface InterestHypothesis {
  readonly id: string;
  readonly kidId: string;
  readonly cellKey: string;
  readonly domainPath: DomainPath;
  readonly mode: string;
  readonly state: Lifecycle;
  readonly version: number;
  readonly evidence: HypothesisEvidence;
  // opaque structural reference (e.g. a socratic-defense EvidenceRecord id) — decoupled from 010's type.
  readonly perseveranceArtifactRef?: string;
  readonly history: readonly HistoryEntry[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface HypothesisStore {
  readonly byId: Readonly<Record<string, InterestHypothesis>>;
}
