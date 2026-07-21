import { type HypothesisRevision, SIGNAL_FAMILIES, type SignalFamily } from "@gt100k/interest-lab-domain";
import type { ConstellationStar, EvidenceConstellationView, ReturnTimelineView } from "./model";

const brightnessFor = (family: SignalFamily, present: ReadonlySet<SignalFamily>): number => {
  if (!present.has(family)) {
    return 0.18;
  }

  return family === "voluntary_return" ? 1 : 0.7;
};

const starFor = (
  family: SignalFamily,
  index: number,
  present: ReadonlySet<SignalFamily>,
): ConstellationStar => ({
  family,
  position: [0, (12 - index * 4) / 10, index % 2 === 0 ? 0 : -0.3],
  brightness: brightnessFor(family, present),
  pull: "neutral",
});

export function buildEvidenceConstellationView(
  revision: HypothesisRevision,
  _timeline: ReturnTimelineView,
): EvidenceConstellationView {
  const present = new Set(revision.signalSummary.familiesPresent);

  return {
    stars: SIGNAL_FAMILIES.map((family, index) => starFor(family, index, present)),
    supportingAnchor: [2.4, 0.4, 0],
    disconfirmingAnchor: [-2.4, 0.4, 0],
    domEquivalent: true,
  };
}
