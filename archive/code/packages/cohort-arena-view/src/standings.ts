export interface StandingSelf {
  readonly selfGain: number;
}

export interface AnonymizedPeer {
  readonly pseudonym: string;
  readonly gain: number;
}

export interface StandingsView {
  readonly band: string;
  readonly anonymizedPeers: AnonymizedPeer[];
  readonly selfGain: number;
  readonly gainToBandTop: number;
}

function comparePeers(left: AnonymizedPeer, right: AnonymizedPeer): number {
  if (left.pseudonym !== right.pseudonym) {
    return left.pseudonym < right.pseudonym ? -1 : 1;
  }
  return left.gain - right.gain;
}

export function deriveStandingsView(
  self: StandingSelf,
  nearPeers: readonly AnonymizedPeer[],
  options: { readonly optedIn: boolean },
): StandingsView | null {
  if (!options.optedIn) return null;

  const anonymizedPeers = nearPeers
    .map(({ pseudonym, gain }) => ({ pseudonym, gain }))
    .sort(comparePeers);
  const bandTopGain = Math.max(self.selfGain, ...anonymizedPeers.map(({ gain }) => gain));

  return {
    band: "near-peer",
    anonymizedPeers,
    selfGain: self.selfGain,
    gainToBandTop: bandTopGain - self.selfGain,
  };
}
