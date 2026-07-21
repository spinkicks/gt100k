import type { NearPeerStanding } from "./model";

type StandingSelf = { band: string; selfGain: number };
type NearPeerGain = { pseudonym: string; gain: number };
type StandingOptions = { optedIn?: boolean };

export function deriveStanding(
  self: StandingSelf,
  nearPeers: readonly NearPeerGain[],
  options?: StandingOptions,
): NearPeerStanding | null {
  if (options?.optedIn !== true) return null;

  const anonymizedPeers = nearPeers.map(({ pseudonym, gain }) => ({ pseudonym, gain }));
  const bandTop = anonymizedPeers.reduce(
    (highestGain, peer) => Math.max(highestGain, peer.gain),
    self.selfGain,
  );

  return {
    band: self.band,
    anonymizedPeers,
    selfGain: self.selfGain,
    gainToBandTop: bandTop - self.selfGain,
  };
}
