import type { AnonymizedPeer, StandingSelf, StandingsView } from "../../src/index.js";

const self = { selfGain: 300 } satisfies StandingSelf;

const nearPeers = [
  { pseudonym: "kestrel", gain: 260 },
  { pseudonym: "otter", gain: 340 },
  { pseudonym: "finch", gain: 300 },
] satisfies AnonymizedPeer[];

export const viewStandings = {
  self,
  nearPeers,
  expected: {
    optedOut: null,
    optedIn: {
      band: "near-peer",
      anonymizedPeers: [
        { pseudonym: "finch", gain: 300 },
        { pseudonym: "kestrel", gain: 260 },
        { pseudonym: "otter", gain: 340 },
      ],
      selfGain: 300,
      gainToBandTop: 40,
    } satisfies StandingsView,
  },
};
